import { Response } from "express";
import { ErrorResponse, RequestCustom, SuccessResponse } from "../types";
import { validationResult } from "express-validator";
import { ERROR_CLIENT, SUCCESS } from "../constants";
import {
  handleCheckUserInChat,
  handleCreateChatService,
  handleGetChatService,
  handleGetMessageChatService,
  handleSeenService,
} from "../services/chat-services";

export const handleCreateChat = async (req: RequestCustom, res: Response) => {
  // Kiểm tra kết quả validation
  const errors = validationResult(req);
  // Nếu có lỗi validation, gửi lại lỗi cho client
  if (!errors.isEmpty()) {
    const response: ErrorResponse = {
      success: false,
      message: `Thông tin không hợp lệ: ${errors.array()[0].msg}`,
      error: errors.array()[0].msg,
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(response);
  }
  const { user } = req;
  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Chưa cung cấp người dùng",
      error: "Chưa cung cấp người dùng",
      statusCode: 400,
      type: ERROR_CLIENT,
    });
  }

  const file: Express.Multer.File | undefined = req.file;
  const { members, name }: { members: string[]; name?: string } = req.body;
  if (members.includes(user.id)) {
    const response: ErrorResponse = {
      success: false,
      message: `Mảng danh sách thành viên không hợp lệ`,
      error: `Mảng danh sách thành viên không hợp lệ`,
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(response);
  }
  const result = await handleCreateChatService({
    user,
    members,
    name,
    groupPhoto: file,
  });
  // Kiểm tra kết quả và phản hồi tương ứng
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(200).json(result);
  }
};

export const handleGetChat = async (req: RequestCustom, res: Response) => {
  const { user } = req;
  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Chưa cung cấp người dùng",
      error: "Chưa cung cấp người dùng",
      statusCode: 400,
      type: ERROR_CLIENT,
    });
  }
  const result = await handleGetChatService({ user });
  // Kiểm tra kết quả và phản hồi tương ứng
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(200).json(result);
  }
};

export const handleGetDetailChat = async (
  req: RequestCustom,
  res: Response
) => {
  const { user } = req;
  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Chưa cung cấp người dùng",
      error: "Chưa cung cấp người dùng",
      statusCode: 400,
      type: ERROR_CLIENT,
    });
  }
  const { chatId } = req.params;
  if (!chatId) {
    return res.status(400).json({
      success: false,
      message: "Chưa cung cấp ID cuộc trò chuyện",
      error: "Chưa cung cấp ID cuộc trò chuyện",
      statusCode: 400,
      type: ERROR_CLIENT,
    });
  }
  /** Check user in chat */
  const check = await handleCheckUserInChat({ user, chatId });
  if (!check.inChat || check.chat === null) {
    return res.status(400).json({
      success: false,
      message: "Không có quyền truy cập cuộc trò chuyện",
      error: "Không có quyền truy cập cuộc trò chuyện",
      statusCode: 403,
      type: ERROR_CLIENT,
    });
  } else {
    const dataResponse: SuccessResponse = {
      success: true,
      message: "Lấy thông tin cuộc trò chuyện thành công",
      data: check.chat,
      statusCode: 200,
      type: SUCCESS,
    };
    return res.status(200).json(dataResponse);
  }
};

export const handleSeen = async (req: RequestCustom, res: Response) => {
  const { user } = req;
  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Chưa cung cấp người dùng",
      error: "Chưa cung cấp người dùng",
      statusCode: 400,
      type: ERROR_CLIENT,
    });
  }
  const { chatId } = req.params;
  if (!chatId) {
    return res.status(400).json({
      success: false,
      message: "Chưa cung cấp ID cuộc trò chuyện",
      error: "Chưa cung cấp ID cuộc trò chuyện",
      statusCode: 400,
      type: ERROR_CLIENT,
    });
  }
  /** Check user in chat */
  const check = await handleCheckUserInChat({ user, chatId });
  if (!check.inChat || check.chat === null) {
    return res.status(400).json({
      success: false,
      message: "Không có quyền truy cập cuộc trò chuyện",
      error: "Không có quyền truy cập cuộc trò chuyện",
      statusCode: 403,
      type: ERROR_CLIENT,
    });
  } else {
    let chatId = check.chat._id.toString();
    const result = await handleSeenService({ user, chatId });
    // Kiểm tra kết quả và phản hồi tương ứng
    if (!result.success) {
      return res.status(result.statusCode).json(result);
    } else {
      return res.status(200).json(result);
    }
  }
};

export const handleGetMessageChat = async (
  req: RequestCustom,
  res: Response
) => {
  const { user } = req;
  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Chưa cung cấp người dùng",
      error: "Chưa cung cấp người dùng",
      statusCode: 400,
      type: ERROR_CLIENT,
    });
  }
  // Parse the query parameters and provide default values if necessary
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;
  const { chatId } = req.params;
  const result = await handleGetMessageChatService({
    limit,
    offset,
    user,
    chatId,
  });
  // Kiểm tra kết quả và phản hồi tương ứng
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(200).json(result);
  }
};
