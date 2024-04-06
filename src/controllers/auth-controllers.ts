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
import { connectRedis } from "../db/redis";
import * as jwtHelper from "../utils/jwt";

/** Xử lý kiểm tra phiên của người dùng */
export const handleAuth = async (req: Request, res: Response) => {
  try {
    const authCookie = req.cookies["refresh-token-id"];
    if (!authCookie) {
      return res.status(401).json({ auth: false });
    } else {
      const client = await connectRedis();
      const dataSession = await client.get(authCookie);
      if (!dataSession) {
        return res.status(401).json({ auth: false });
      } else {
        return res.status(200).json({ auth: true });
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(401).json({ auth: false });
  }
};

/** Xử lý các trang verify như verify OTP */
export const handleVerify = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(403).json({
      verify: false,
      message: `${errors.array()[0].msg}`,
    });
  }
  try {
    const { cookieName } = req.body;
    const client = await connectRedis();
    const cookieValue = req.cookies[cookieName];
    const cookieData = await client.get(cookieValue);
    if (!cookieData) {
      return res.status(403).json({ verify: false });
    } else {
      return res.status(200).json({ verify: true });
    }
  } catch (error) {
    console.log(error);
    return res.status(403).json({
      verify: false,
    });
  }
};

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
    res.cookie("verify-otp-recovery", result.data?.id, {
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
  // Lấy cookie 'verify-otp-recovery'
  const verifyOtpCookie = req.cookies["verify-otp-recovery"];
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
    res.cookie("verify-otp-recovery", "", { maxAge: 0 });
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
    /** Set Cookie */
    res.cookie("access-token", result.data.accessToken.value, {
      maxAge:
        jwtHelper.getExpiryDurationToken(result.data.accessToken.value) * 1000,
      httpOnly: true,
      secure: false,
    });
    /** Delete Key refreshToken and accessToken Before Return */
    if (result.data.refreshToken) {
      delete result.data.refreshToken;
    }
    if (result.data.accessToken) {
      delete result.data.accessToken;
    }
    return res.status(result.statusCode).json(result);
  }
};
