import { Stream } from "stream";
import cloudinary from "../utils/cloudinary-config";
import { ErrorResponse, SuccessResponse } from "../types";
import { ERROR_CLIENT, ERROR_SERVER, SUCCESS } from "../constants";
import { connectMongoDB } from "../db/mongodb";
import AdoptionRequest from "../models/adoptionRequest";
import PetAdoptionPost from "../models/petAdoptionPost";
import Notification from "../models/notification";

const uploadImage = async (file: Express.Multer.File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Tạo một stream upload từ Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "adoption-request" },
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

export const handleCreateAdoptionRequestService = async ({
  user,
  files,
  petAdoptionPost,
  descriptionForPet,
  descriptionForUser,
  type,
  contactInfo,
}: {
  user: { id: string; username: string; email: string };
  files: Express.Multer.File[] | undefined;
  petAdoptionPost: string;
  descriptionForPet: string;
  descriptionForUser: string;
  type: string;
  contactInfo: string;
}) => {
  try {
    /** Upload image */
    let imageUrls: string[] = [];
    if (files && files.length > 0) {
      imageUrls = await Promise.all(files.map((file) => uploadImage(file)));
    }

    await connectMongoDB();

    const postInfo = await PetAdoptionPost.findById(petAdoptionPost);
    if (!postInfo) {
      return {
        success: false,
        message: "Pet adoption post not found",
        error: "Pet adoption post not found",
        statusCode: 404,
        type: ERROR_CLIENT,
      } as ErrorResponse;
    }

    if (user.id === postInfo.poster._id.toString()) {
      return {
        success: false,
        message: "Cannot request for post because you is poster",
        error: "Cannot request",
        statusCode: 403,
        type: ERROR_CLIENT,
      } as ErrorResponse;
    }

    // Kiểm tra xem yêu cầu đã tồn tại chưa
    const existingRequest = await AdoptionRequest.findOne({
      requester: user.id,
      petAdoptionPost: petAdoptionPost,
      status: { $in: ["pending", "approved"] },
    });

    if (existingRequest) {
      return {
        success: false,
        message: "You have already sent an adoption request for this pet",
        error: "You have already sent an adoption request for this pet",
        statusCode: 400,
        type: ERROR_SERVER,
      } as ErrorResponse;
    }

    let dateCreate: any = {
      requester: user.id,
      petAdoptionPost,
      descriptionForPet,
      descriptionForUser,
      contactInfo,
      type,
      status: "pending",
      images: imageUrls,
    };

    // Tạo yêu cầu nhận nuôi
    const newRequest = await AdoptionRequest.create(dateCreate);

    postInfo.adoptionRequests.push(newRequest);
    await postInfo.save();

    // Notification
    const notification = new Notification({
      receiver: postInfo.poster._id.toString(),
      status: "unseen",
      title: "New request for adopt pet",
      subtitle: `${user.username} has requested adopt pet`,
      moreInfo: `/pet-adoption/${petAdoptionPost}`,
    });

    // Return
    const dataResponse: SuccessResponse = {
      success: true,
      message: "Adoption request created successfully",
      data: newRequest,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Failed to create adoption request",
      error: "Failed to create adoption request: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};
