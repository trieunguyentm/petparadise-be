import { Request, Response } from "express";
import {
  handleConfirmPasswordService,
  handleLoginService,
  handleRecoveryPasswordService,
  handleRegisterService,
  handleVerifyOTPRecoveryService,
  handleVerifyOTPService,
} from "../services/auth-services";
import { validationResult } from "express-validator";
import { ERROR_CLIENT, ERROR_SESSION } from "../constants";
import { ErrorResponse } from "../types/response";
import * as jwtHelper from "../utils/jwt";

export const handleRegister = async (req: Request, res: Response) => {
  // Kiểm tra kết quả validation
  const errors = validationResult(req);
  // Nếu có lỗi validation, gửi lại lỗi cho client
  if (!errors.isEmpty()) {
    const response: ErrorResponse = {
      success: false,
      message: `Invalid data:${errors.array()[0].msg}`,
      error: errors.array()[0].msg,
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(response);
  }
  const { username, email, password } = req.body;
  const result = await handleRegisterService({ username, email, password });
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    /** Set Cookie */
    res.cookie("verify-otp", result.data?.id, {
      maxAge: 300 * 1000,
      httpOnly: true,
      secure: false,
    });
    return res.status(result.statusCode).json(result);
  }
};

export const handleVerifyOTP = async (req: Request, res: Response) => {
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
  const { otpCode } = req.body;
  // Lấy cookie 'verify-otp'
  const verifyOtpCookie = req.cookies["verify-otp"];
  if (!verifyOtpCookie) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Session expired",
      error: "Session expired",
      statusCode: 401,
      type: ERROR_SESSION,
    };
    return res.status(401).json(dataResponse);
  }
  const result = await handleVerifyOTPService({ otpCode, verifyOtpCookie });
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    // Xóa cookie "verify-otp" bằng cách set nó với maxAge là 0 hoặc set expire date là quá khứ
    res.cookie("verify-otp", "", { maxAge: 0 });
    return res.status(result.statusCode).json(result);
  }
};

export const handleRecoveryPassword = async (req: Request, res: Response) => {
  // Kiểm tra kết quả validation
  const errors = validationResult(req);
  // Nếu có lỗi validation, gửi lại lỗi cho client
  if (!errors.isEmpty()) {
    const response: ErrorResponse = {
      success: false,
      message: `Invalid data:${errors.array()[0].msg}`,
      error: errors.array()[0].msg,
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(response);
  }
  const { email } = req.body;
  const result = await handleRecoveryPasswordService({ email });
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    /** Set Cookie */
    res.cookie("recovery-password", result.data?.id, {
      maxAge: 300 * 1000,
      httpOnly: true,
      secure: false,
    });
    return res.status(result.statusCode).json(result);
  }
};

export const handleVerifyOTPRecovery = async (req: Request, res: Response) => {
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
  const { otpCode } = req.body;
  // Lấy cookie 'recovery-password'
  const verifyOtpCookie = req.cookies["recovery-password"];
  if (!verifyOtpCookie) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Session expired",
      error: "Session expired",
      statusCode: 401,
      type: ERROR_SESSION,
    };
    return res.status(401).json(dataResponse);
  }
  const result = await handleVerifyOTPRecoveryService({
    otpCode,
    verifyOtpCookie,
  });
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    // Xóa cookie "verify-otp" bằng cách set nó với maxAge là 0 hoặc set expire date là quá khứ
    res.cookie("recovery-password", "", { maxAge: 0 });
    // Thêm cookie "confirm-password"
    res.cookie("confirm-password", result.data?.id, {
      maxAge: 300 * 1000,
      httpOnly: true,
      secure: false,
    });
    return res.status(result.statusCode).json(result);
  }
};

export const handleConfirmPassword = async (req: Request, res: Response) => {
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
  const { password } = req.body;
  // Lấy cookie 'confirm-password'
  const confirmPasswordCookie = req.cookies["confirm-password"];
  if (!confirmPasswordCookie) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Session expired",
      error: "Session expired",
      statusCode: 401,
      type: ERROR_SESSION,
    };
    return res.status(401).json(dataResponse);
  }
  const result = await handleConfirmPasswordService({
    password,
    confirmPasswordCookie,
  });
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    res.cookie("confirm-password", "", { maxAge: 0 });
    return res.status(result.statusCode).json(result);
  }
};

export const handleLogin = async (req: Request, res: Response) => {
  // Kiểm tra kết quả validation
  const errors = validationResult(req);
  // Nếu có lỗi validation, gửi lại lỗi cho client
  if (!errors.isEmpty()) {
    const response: ErrorResponse = {
      success: false,
      message: `Invalid data:${errors.array()[0].msg}`,
      error: errors.array()[0].msg,
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(response);
  }
  const { email, password } = req.body;
  const result = await handleLoginService({ email, password });
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    /** Set Cookie */
    res.cookie("refresh-token-id", result.data.refreshToken.jti, {
      maxAge:
        jwtHelper.getExpiryDurationToken(result.data.refreshToken.value) * 1000,
      httpOnly: true,
      secure: false,
    });
    /** Delete Key RefreshToken Before Return */
    if (result.data.refreshToken) {
      delete result.data.refreshToken;
    }
    return res.status(result.statusCode).json(result);
  }
};
