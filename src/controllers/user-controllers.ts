import { Response } from "express";
import { ErrorResponse, RequestCustom } from "../types";
import { ERROR_CLIENT } from "../constants";
import {
  handleChangePasswordService,
  handleGetUserService,
  handleUpdateService,
} from "../services/user-services";
import { validationResult } from "express-validator";

export const handleGetUser = async (req: RequestCustom, res: Response) => {
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
    const result = await handleGetUserService({ user });
    if (!result.success) {
      return res.status(result.statusCode).json(result);
    } else {
      return res.status(result.statusCode).json(result);
    }
  }
};

export const handleChangePassword = async (
  req: RequestCustom,
  res: Response
) => {
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
  const { currentPassword, newPassword } = req.body;
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
    const result = await handleChangePasswordService({
      user,
      newPassword,
      currentPassword,
    });
    if (!result.success) {
      return res.status(result.statusCode).json(result);
    } else {
      return res.status(result.statusCode).json(result);
    }
  }
};

export const handleUpdate = async (req: RequestCustom, res: Response) => {
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
    if (!req.file) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Please provide an image",
        error: "Please provide an image",
        statusCode: 400,
        type: ERROR_CLIENT,
      };
      return res.status(400).json(dataResponse);
    } else {
      const file = req.file;
      const result = await handleUpdateService({ user, file });
      if (!result.success) {
        return res.status(result.statusCode).json(result);
      } else {
        return res.status(result.statusCode).json(result);
      }
    }
  }
};
