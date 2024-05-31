import { Response } from "express";
import { ErrorResponse, RequestCustom } from "../types";
import { ERROR_CLIENT } from "../constants";
import {
  handleAddCommentService,
  handleCreatePostService,
  handleGetDetailPostService,
  handleGetPostService,
  handleSearchPostService,
} from "../services/post-services";
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
  const { content, tags } = req.body; // Nhận content và tags từ body

  // Gọi service để xử lý logic tạo post
  const result = await handleCreatePostService({ user, files, content, tags });

  // Kiểm tra kết quả và phản hồi tương ứng
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(200).json(result);
  }
};

export const handleGetPost = async (req: RequestCustom, res: Response) => {
  // Parse the query parameters and provide default values if necessary
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;

  // Now pass these variables to the service function
  const result = await handleGetPostService({ limit, offset });

  // Check the result and respond accordingly
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(200).json(result);
  }
};

export const handleSearchPost = async (req: RequestCustom, res: Response) => {
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
  const { query } = req.query;
  // Lấy query từ req.query và đảm bảo nó là một chuỗi
  if (typeof query !== "string") {
    const response: ErrorResponse = {
      success: false,
      message: "Query must be a string.",
      error: "Invalid query parameter",
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(response);
  }
  const result = await handleSearchPostService({ query });
  // Check the result and respond accordingly
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(200).json(result);
  }
};

export const handleGetDetailPost = async (
  req: RequestCustom,
  res: Response
) => {
  const { postId } = req.params;
  if (!postId) {
    const response: ErrorResponse = {
      success: false,
      message: `Invalid post id`,
      error: "Not provide post id",
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(response);
  } else {
    const result = await handleGetDetailPostService({ postId });
    // Check the result and respond accordingly
    if (!result.success) {
      return res.status(result.statusCode).json(result);
    } else {
      return res.status(200).json(result);
    }
  }
};

export const handleAddComment = async (req: RequestCustom, res: Response) => {
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
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Not provide user",
      error: "Not provide user",
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(dataResponse);
  } else {
    const file = req.file;
    const { postId, content } = req.body;
    const result = await handleAddCommentService({
      user,
      postId,
      content,
      file,
    });
    if (!result.success) {
      return res.status(result.statusCode).json(result);
    } else {
      return res.status(result.statusCode).json(result);
    }
  }
};
