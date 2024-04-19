import { Stream } from "stream";
import cloudinary from "../utils/cloudinary-config";
import Chat from "../models/chat";
import { connectMongoDB } from "../db/mongodb";
import { ErrorResponse, SuccessResponse } from "../types";
import { ERROR_SERVER } from "../constants";
import User from "../models/user";

const uploadImage = async (file: Express.Multer.File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Tạo một stream upload từ Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "chat_avatar" },
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

export const handleCreateChatService = async ({
  user,
  members,
  name,
  groupPhoto,
}: {
  user: { id: string; username: string; email: string };
  members: string[];
  name?: string | undefined;
  groupPhoto?: Express.Multer.File | undefined;
}) => {
  try {
    await connectMongoDB();
    /** Kiểm tra tính hợp lệ của mảng Member */
    const count = await User.countDocuments({
      _id: { $in: members },
    });

    if (count !== members.length) {
      return {
        success: false,
        message: "One or more member IDs are invalid",
        error: "Invalid member IDs",
        statusCode: 400,
        type: "ERROR_CLIENT",
      };
    }

    const isGroup = members.length >= 2;
    let chat;
    if (isGroup) {
      // Trường hợp là nhóm
      chat = await Chat.findOne({
        name: name,
        isGroup: true,
        members: { $all: [user.id, ...members], $size: members.length + 1 },
      });
    } else {
      // Trường hợp chỉ có hai thành viên
      chat = await Chat.findOne({
        isGroup: false,
        members: { $all: [user.id, ...members], $size: 2 },
      });
    }

    if (!chat) {
      // Nếu không tìm thấy chat, tạo mới
      let groupPhotoUrl: string = "";
      if (groupPhoto) {
        groupPhotoUrl = await uploadImage(groupPhoto);
      }

      chat = new Chat({
        members: [user.id, ...members],
        isGroup,
        name: isGroup ? name || "" : "",
        groupPhoto: isGroup ? groupPhotoUrl || "" : "",
      });

      await chat.save();
    }
    const dataResponse: SuccessResponse = {
      success: true,
      message: "Chat fetched or created successfully",
      data: chat,
      statusCode: 200,
      type: "SUCCESS",
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Failed when create chat",
      error: "Failed when create chat: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};
