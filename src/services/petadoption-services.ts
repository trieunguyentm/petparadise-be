import { Stream } from "stream";
import cloudinary from "../utils/cloudinary-config";
import {
  ErrorResponse,
  GenderPet,
  ReasonFindOwner,
  SuccessResponse,
  TypePet,
} from "../types";
import { ERROR_SERVER, SUCCESS } from "../constants";
import { connectMongoDB } from "../db/mongodb";
import PetAdoptionPost from "../models/petAdoptionPost";
import User from "../models/user";

const uploadImage = async (file: Express.Multer.File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Tạo một stream upload từ Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "image_find_owner_pet" },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (!result) {
          reject(new Error("Upload failed without a specific error."));
        } else {
          resolve(result.url); // Khi upload thành công, trả về URL của ảnh
        }
      }
    );

    // Tạo một stream từ buffer của file và pipe nó vào stream upload của Cloudinary
    const bufferStream = new Stream.PassThrough();
    bufferStream.end(file.buffer);
    bufferStream.pipe(uploadStream);
  });
};

export const handleCreatePetAdoptionPostService = async ({
  user,
  files,
  typePet,
  reason,
  genderPet,
  location,
  description,
  healthInfo,
  contactInfo,
}: {
  user: { id: string; username: string; email: string };
  files: Express.Multer.File[];
  typePet: TypePet;
  reason: ReasonFindOwner;
  genderPet: GenderPet;
  location: string;
  description: string;
  healthInfo: string;
  contactInfo: string;
}) => {
  try {
    // Hàm uploadImage để tải ảnh lên Cloudinary và trả về URL
    const imageUrls = await Promise.all(files.map((file) => uploadImage(file)));

    await connectMongoDB();

    let dataCreate: any = {
      poster: user.id,
      petType: typePet,
      healthInfo,
      description,
      location,
      contactInfo,
      reason,
      images: imageUrls,
    };
    if (genderPet) dataCreate = { ...dataCreate, gender: genderPet };

    // Tạo bài đăng tìm chủ nhân cho thú cưng
    const newPetAdoptionPost = await PetAdoptionPost.create(dataCreate);

    const userInfo = await User.findById(user.id);
    userInfo?.petAdoptionPosts.push(newPetAdoptionPost);
    await userInfo?.save();

    const dataResponse: SuccessResponse = {
      success: true,
      message: "Post created successfully",
      data: newPetAdoptionPost,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Failed to create pet adoption post",
      error: "Failed to create pet adoption post: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleGetPetAdoptionPostService = async ({
  limit,
  offset,
}: {
  limit: number;
  offset: number;
}) => {
  try {
    await connectMongoDB();
    const petAdoptionPosts = await PetAdoptionPost.find()
      .skip(offset)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate({
        path: "poster",
        model: User,
        select: "username email profileImage",
      })
      .exec();
    const dataResponse: SuccessResponse = {
      success: true,
      message: "Get pet adoption post successfully",
      data: petAdoptionPosts,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Failed to get pet adoption post",
      error: "Failed to get pet adoption post: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleGetPetAdoptionPostByIdService = async ({
  postId,
}: {
  postId: string;
}) => {
  try {
    await connectMongoDB();
    const petAdoptionPost = await PetAdoptionPost.findById(postId)
      .populate({
        path: "poster",
        model: User,
        select: "username email profileImage",
      })
      .exec();

    const dataResponse: SuccessResponse = {
      success: true,
      message: "Get pet adoption post successfully",
      data: petAdoptionPost,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Failed to get post",
      error: "Failed to get post: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};
