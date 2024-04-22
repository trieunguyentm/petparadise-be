import { Stream } from "stream";
import cloudinary from "../utils/cloudinary-config";
import Chat, { IChatDocument } from "../models/chat";
import { connectMongoDB } from "../db/mongodb";
import { ErrorResponse, SuccessResponse } from "../types";
import { ERROR_CLIENT, ERROR_SERVER, SUCCESS } from "../constants";
import User, { IUserDocument } from "../models/user";
import { pusherServer } from "../utils/pusher";
import Message from "../models/message";

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
        lastMessage: `${user.username} started the conversation`,
        seenBy: [user.id],
      });

      await chat.save();

      // Prepare the data to be sent to Pusher
      const chatForPusher = {
        _id: chat._id,
        members: chat.members,
        isGroup: chat.isGroup,
        name: chat.name,
        groupPhoto: chat.groupPhoto,
        lastMessage: chat.lastMessage,
        lastMessageAt: chat.lastMessageAt,
      };
      // Trigger an event to all members of the chat
      chat.members.map(async (member) => {
        await pusherServer.trigger(
          member._id.toString(),
          "new-chat",
          chatForPusher
        );
      });
    }
    const dataResponse: SuccessResponse = {
      success: true,
      message: "Chat fetched or created successfully",
      data: chat,
      statusCode: 200,
      type: SUCCESS,
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

export const handleGetChatService = async ({
  user,
}: {
  user: { id: string; username: string; email: string };
}) => {
  try {
    await connectMongoDB();

    const allChats = await Chat.find({ members: user.id })
      .sort({
        lastMessageAt: -1,
      })
      .populate({
        path: "members",
        model: User,
        select: "_id username profileImage",
      });

    const dataResponse: SuccessResponse = {
      success: true,
      message: "List chat fetched successfully",
      data: allChats,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Failed when fetch list chat",
      error: "Failed when fetch list chat: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleCheckUserInChat = async ({
  user,
  chatId,
}: {
  user: { id: string; username: string; email: string };
  chatId: string;
}) => {
  try {
    await connectMongoDB();
    // Tìm chat
    const chat = await Chat.findOne({
      _id: chatId,
      members: user.id,
    })
      .populate({ path: "members", model: User })
      .exec();
    if (!chat) {
      return {
        inChat: false,
        chat: null,
        type: ERROR_CLIENT,
      };
    } else {
      return {
        inChat: true,
        chat: chat,
        type: SUCCESS,
      };
    }
  } catch (error) {
    return {
      inChat: false,
      chat: null,
      type: ERROR_SERVER,
    };
  }
};

export const handleSeenService = async ({
  user,
  chatId,
}: {
  user: { id: string; username: string; email: string };
  chatId: string;
}) => {
  try {
    await connectMongoDB();
    const updatedChat = (await Chat.findByIdAndUpdate(
      chatId,
      {
        $addToSet: { seenBy: user.id },
      },
      { new: true }
    ).exec()) as IChatDocument;
    /** Trigger seen-chat to client */

    await pusherServer.trigger(user.id.toString(), "seen-chat", updatedChat);

    const dataResponse: SuccessResponse = {
      success: true,
      message: "Seen successfully",
      data: "Seen successfully",
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Failed when seen chat",
      error: "Failed when seen chat: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleGetMessageChatService = async ({
  limit,
  offset,
  user,
  chatId,
}: {
  limit: number;
  offset: number;
  user: { id: string; username: string; email: string };
  chatId: string;
}) => {
  try {
    await connectMongoDB();
    // Check chatInfo
    const chat = await Chat.findById(chatId).populate({
      path: "members",
      model: User,
      select: "_id",
    });
    if (!chat) {
      const dataResponse: ErrorResponse = {
        success: false,
        message: "Chat ID not found",
        error: "Chat ID not found",
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
        message: "User is not a member of the chat",
        error: "Access denied",
        statusCode: 403,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }
    const messages = await Message.find({ chat: chatId })
      .sort({
        createdAt: -1,
      })
      .skip(offset)
      .limit(limit)
      .populate({
        path: "sender",
        model: User,
        select: "_id username email profileImage",
      })
      .exec();
    // Return
    const dataResponse: SuccessResponse = {
      success: true,
      message: "Get message successfully",
      data: messages,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Failed to get message",
      error: "Failed to get message: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};
