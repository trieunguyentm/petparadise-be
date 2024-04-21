import { Response } from "express";
import { ErrorResponse, RequestCustom, SuccessResponse } from "../types";
import { validationResult } from "express-validator";
import { ERROR_CLIENT, SUCCESS } from "../constants";
import {
  handleCheckUserInChat,
  handleCreateChatService,
  handleGetChatService,
} from "../services/chat-services";

export const handleCreateChat = async (req: RequestCustom, res: Response) => {
  // Kiểm tra kết quả validation
  const errors = validationResult(req);
  // Nếu có lỗi validation, gửi lại lỗi cho client
  if (!errors.isEmpty()) {
    const response: ErrorResponse = {
      success: false,
      message: `Invalid data: ${errors.array()[0].msg}`,
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
      message: "Not provide user",
      error: "Not provide user",
      statusCode: 400,
      type: ERROR_CLIENT,
    });
  }

  const file: Express.Multer.File | undefined = req.file;
  const { members, name }: { members: string[]; name?: string } = req.body;
  if (members.includes(user.id)) {
    const response: ErrorResponse = {
      success: false,
      message: `Members cannot contain the user's id`,
      error: `Members cannot contain the user's id`,
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
      message: "Not provide user",
      error: "Not provide user",
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
      message: "Not provide user",
      error: "Not provide user",
      statusCode: 400,
      type: ERROR_CLIENT,
    });
  }
  const { chatId } = req.params;
  if (!chatId) {
    return res.status(400).json({
      success: false,
      message: "Not provide chatId",
      error: "Not provide chatId",
      statusCode: 400,
      type: ERROR_CLIENT,
    });
  }
  /** Check user in chat */
  const check = await handleCheckUserInChat({ user, chatId });
  if (!check.inChat || check.chat === null) {
    return res.status(400).json({
      success: false,
      message: "No access to conversations",
      error: "No access to conversations",
      statusCode: 403,
      type: ERROR_CLIENT,
    });
  } else {
    const dataResponse: SuccessResponse = {
      success: true,
      message: "Get Detail Chat successfully",
      data: check.chat,
      statusCode: 200,
      type: SUCCESS,
    };
    return res.status(200).json(dataResponse);
  }
};
