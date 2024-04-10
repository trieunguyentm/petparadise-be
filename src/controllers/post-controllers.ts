import { Response } from "express";
import { ErrorResponse, RequestCustom } from "../types";
import { ERROR_CLIENT } from "../constants";
import { handleCreatePostService } from "../services/post-services";
import { validationResult } from "express-validator";

export const handleCreatePost = async (req: RequestCustom, res: Response) => {
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

  const files: Express.Multer.File[] = req.files as Express.Multer.File[];
  const { content, tags } = req.body; // Giả sử bạn nhận content và tags từ body

  // Gọi service để xử lý logic tạo post
  const result = await handleCreatePostService({ user, files, content, tags });

  // Kiểm tra kết quả và phản hồi tương ứng
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(200).json(result);
  }
};
