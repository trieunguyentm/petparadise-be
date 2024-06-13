import { validationResult } from "express-validator";
import { ErrorResponse, RequestCustom } from "../types";
import { ERROR_CLIENT } from "../constants";
import { Response } from "express";
import { handleCreateMessageService } from "../services/message-services";

export const handleCreateMessage = async (
  req: RequestCustom,
  res: Response
) => {
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
  const { text, chatId } = req.body;
  const file = req.file;
  if (!text && !file) {
    const response: ErrorResponse = {
      success: false,
      message: `Vui lòng cung cấp nội dung tin nhắn`,
      error: `Vui lòng cung cấp nội dung tin nhắn`,
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(response);
  }
  const result = await handleCreateMessageService({ user, chatId, text, file });
  // Kiểm tra kết quả và phản hồi tương ứng
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(200).json(result);
  }
};
