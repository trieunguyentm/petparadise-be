import { Stream } from "stream";
import { ERROR_CLIENT, ERROR_SERVER, SUCCESS } from "../constants";
import { ErrorResponse, SuccessResponse } from "../types";
import cloudinary from "../utils/cloudinary-config";
import Chat from "../models/chat";
import User, { IUserDocument } from "../models/user";
import Message from "../models/message";
import { connectMongoDB } from "../db/mongodb";
import { pusherServer } from "../utils/pusher";

const uploadImage = async (file: Express.Multer.File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Tạo một stream upload từ Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "message-image" },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (!result) {
          reject(new Error("Tải ảnh không thành công"));
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

export const handleCreateMessageService = async ({
  user,
  chatId,
  text,
  file,
}: {
  user: { id: string; username: string; email: string };
  chatId: string;
  text: string;
  file: Express.Multer.File | undefined;
}) => {
  try {
    await connectMongoDB();
    // Check chatInfo
    const chat = await Chat.findById(chatId).populate({
      path: "members",
      model: User,
    });
    if (!chat) {
      const dataResponse: ErrorResponse = {
        success: false,
        message: "Không tìm thấy ID cuộc trò chuyện",
        error: "Không tìm thấy ID cuộc trò chuyện",
        statusCode: 404,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }
    // Check user in chat group
    if (
      !chat.members.some(
        (member: IUserDocument) => member._id.toString() === user.id
      )
    ) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Không thể thực hiện",
        error: "Không thể thực hiện",
        statusCode: 403,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }
    let imageUrl = "";
    if (file) {
      imageUrl = await uploadImage(file);
    }
    // Create Message
    const newMessage = await Message.create({
      chat: chatId,
      sender: user.id,
      text: text,
      photo: imageUrl,
      createdAt: new Date(),
      seenBy: [user.id],
    });
    // Populate the sender field with detailed information
    const populatedNewMessage = await Message.findById(newMessage._id).populate(
      { path: "sender", model: User, select: "_id username profileImage" }
    );
    // Update the chat
    chat.messages.push(newMessage);
    chat.lastMessage = text;
    if (imageUrl !== "") chat.lastMessage = `${user.username} đã gửi hình ảnh`;
    chat.lastMessageAt = newMessage.createdAt;
    const userInfo = (await User.findById(user.id).select(
      "_id username email profileImage"
    )) as IUserDocument;
    chat.seenBy = [userInfo];
    await chat.save();

    /** Trigger a Pusher event for a specific chat about the new message */
    await pusherServer.trigger(chatId, "new-message", populatedNewMessage);

    /** Triggers a Pusher event for each member of the chat about the chat update with the latest message */
    chat.members.forEach(async (member: IUserDocument) => {
      try {
        await pusherServer.trigger(member._id.toString(), "update-chat", chat);
      } catch (err) {
        console.error(`Failed to trigger update-chat event`);
      }
    });

    // Return
    const dataResponse: SuccessResponse = {
      success: true,
      message: "Gửi tin nhắn thành công",
      data: newMessage,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi gửi tin nhắn",
      error: "Xảy ra lỗi khi gửi tin nhắn" + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};
