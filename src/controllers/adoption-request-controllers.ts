import { validationResult } from "express-validator";
import { ErrorResponse, RequestCustom } from "../types";
import { ERROR_CLIENT } from "../constants";
import { Response } from "express";
import {
  handleCreateAdoptionRequestService,
  handleGetAdoptionRequestByPostService,
  handleSetAdoptionRequestService,
} from "../services/adoption-request-services";

export const handleCreateAdoptionRequest = async (
  req: RequestCustom,
  res: Response
) => {
  // Kiểm tra kết quả validation
  const errors = validationResult(req);
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
    const response: ErrorResponse = {
      success: false,
      message: "Chưa cung cấp người dùng",
      error: "Chưa cung cấp người dùng",
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(response);
  }
  const files = req.files as Express.Multer.File[] | undefined;
  const {
    petAdoptionPost,
    descriptionForPet,
    descriptionForUser,
    type,
    contactInfo,
  } = req.body;

  if (type === "reclaim-pet") {
    if (!descriptionForPet || !files || files.length === 0) {
      const response: ErrorResponse = {
        success: false,
        message:
          "Vui lòng cung cấp mô tả về thú cưng và tải lên hình ảnh thú cưng",
        error: "Chưa cung cấp hình ảnh hoặc mô tả về thú cưng",
        statusCode: 400,
        type: ERROR_CLIENT,
      };
      return res.status(400).json(response);
    }
  }
  if (type === "adopt-pet") {
    if (!descriptionForUser) {
      const response: ErrorResponse = {
        success: false,
        message: "Cung cấp mô tả về kinh nghiệm nuôi thú cưng của bản thân",
        error: "Cung cấp mô tả về kinh nghiệm nuôi thú cưng của bản thân",
        statusCode: 400,
        type: ERROR_CLIENT,
      };
      return res.status(400).json(response);
    }
  }

  const result = await handleCreateAdoptionRequestService({
    user,
    files,
    petAdoptionPost,
    descriptionForPet,
    descriptionForUser,
    type,
    contactInfo,
  });

  // Kiểm tra kết quả và phản hồi tương ứng
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(200).json(result);
  }
};

export const handleGetAdoptionRequestByPost = async (
  req: RequestCustom,
  res: Response
) => {
  // Parse the query parameters and provide default values if necessary
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;

  const { postId } = req.params;
  if (!postId) {
    const response: ErrorResponse = {
      success: false,
      message: "Chưa cung cấp ID bài viết",
      error: "Chưa cung cấp ID bài viết",
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(response);
  }

  const { user } = req;
  if (!user) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Chưa cung cấp người dùng",
      error: "Chưa cung cấp người dùng",
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(dataResponse);
  }

  const result = await handleGetAdoptionRequestByPostService({
    user,
    postId,
    limit,
    offset,
  });

  // Check the result and respond accordingly
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(200).json(result);
  }
};

export const handleSetAdoptionRequest = async (
  req: RequestCustom,
  res: Response
) => {
  // Kiểm tra kết quả validation
  const errors = validationResult(req);
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
    const response: ErrorResponse = {
      success: false,
      message: "Chưa cung cấp người dùng",
      error: "Chưa cung cấp người dùng",
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(response);
  }
  const { status } = req.body;
  const { requestId } = req.params;
  const result = await handleSetAdoptionRequestService({
    user,
    status,
    requestId,
  });

  // Check the result and respond accordingly
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(200).json(result);
  }
};
