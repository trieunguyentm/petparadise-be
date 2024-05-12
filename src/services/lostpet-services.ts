import { Stream } from "stream";
import cloudinary from "../utils/cloudinary-config";
import {
  ErrorResponse,
  GenderPet,
  SizePet,
  SuccessResponse,
  TypePet,
} from "../types";
import { ERROR_SERVER, SUCCESS } from "../constants";
import { connectMongoDB } from "../db/mongodb";
import LostPetPost from "../models/lostPetPost";
import User from "../models/user";

const uploadImage = async (file: Express.Multer.File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Tạo một stream upload từ Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "image_pet" },
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

export const handleCreateFindPetPostService = async ({
  user,
  files,
  typePet,
  genderPet,
  sizePet,
  lastSeenLocation,
  lastSeenDate,
  description,
  contactInfo,
}: {
  user: { id: string; username: string; email: string };
  files: Express.Multer.File[];
  typePet: TypePet;
  genderPet: GenderPet;
  sizePet: SizePet;
  lastSeenLocation: string;
  lastSeenDate: Date;
  description: string;
  contactInfo: string;
}) => {
  try {
    // Hàm uploadImage để tải ảnh lên Cloudinary và trả về URL
    const imageUrls = await Promise.all(files.map((file) => uploadImage(file)));

    await connectMongoDB();

    let dataCreate: any = {
      poster: user.id,
      petType: typePet,
      lastSeenLocation,
      lastSeenDate,
      description,
      contactInfo,
      images: imageUrls,
    };
    if (genderPet) dataCreate = { ...dataCreate, gender: genderPet };
    if (sizePet) dataCreate = { ...dataCreate, size: sizePet };
    // Tạo bài đăng tìm thú cưng mới
    const newFindPetPost = await LostPetPost.create(dataCreate);

    const userInfo = await User.findById(user.id);
    userInfo?.findPetPosts.push(newFindPetPost);
    await userInfo?.save();

    const dataResponse: SuccessResponse = {
      success: true,
      message: "Post created successfully",
      data: newFindPetPost,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Failed to create post find pet",
      error: "Failed to create post find pet: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleGetFindPetPostService = async ({
  limit,
  offset,
}: {
  limit: number;
  offset: number;
}) => {
  try {
    await connectMongoDB();
    const findPetPosts = await LostPetPost.find()
      .skip(offset)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate({
        path: "poster",
        model: User,
        select: "-password",
      })
      .exec();
    const dataResponse: SuccessResponse = {
      success: true,
      message: "Get find pet post successfully",
      data: findPetPosts,
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
