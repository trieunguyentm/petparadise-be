import {
  ERROR_CLIENT,
  ERROR_SERVER,
  ERROR_SESSION,
  SUCCESS,
} from "../constants";
import { v4 } from "uuid";
import { connectMongoDB } from "../db/mongodb";
import { connectRedis } from "../db/redis";
import {
  generateRecoveryPasswordMail,
  generateRegisterMail,
} from "../utils/mailgenerate";
import { sendEmail } from "../utils/mailer";
import User from "../models/user";
import { ErrorResponse, SuccessResponse } from "../types";
import bcrypt, { hash } from "bcryptjs";
import * as jwtHelper from "../utils/jwt";

export const handleRegisterService = async ({
  username,
  email,
  password,
}: {
  username: string;
  email: string;
  password: string;
}) => {
  await connectMongoDB();
  // Check exist email and username
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Email already exists",
      error: "Email already exists",
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return dataResponse;
  }
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Username already exists",
      error: "Username already exists",
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return dataResponse;
  }
  try {
    // Tạo random code
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    // Tạo uuid chứa OTP và thông tin đăng ký
    const id = v4();
    const client = await connectRedis();
    client.set(
      id,
      JSON.stringify({
        username,
        email,
        password,
        randomCode,
        count: 0,
        fail: 0,
      }),
      {
        EX: 300,
      }
    );
    // Send HTML Content
    const emailBody = await generateRegisterMail(email, randomCode);
    // Send Email
    const subject = "Verify OTP for register";
    await sendEmail(email, subject, emailBody);
    // Response
    let dataResponse: SuccessResponse = {
      success: true,
      message: "Verify OTP for register",
      data: { id },
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Error when sending email",
      error: error as string,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleResendVerifyOTPService = async ({
  verifyOtpCookie,
}: {
  verifyOtpCookie: string;
}) => {
  const client = await connectRedis();
  const data = await client.get(verifyOtpCookie);
  if (!data) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Session expired",
      error: "Session expired",
      statusCode: 401,
      type: ERROR_SESSION,
    };
    return dataResponse;
  }
  // Nếu có dữ liệu, chuyển từ JSON về Object
  const userData: {
    username: string;
    password: string;
    email: string;
    randomCode: number;
    count: number;
    fail: number;
  } = JSON.parse(data);
  if (!userData.username) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Invalid Session",
      error: "Invalid Session",
      statusCode: 401,
      type: ERROR_SESSION,
    };
    return dataResponse;
  }
  // Kiểm tra số lần resend
  if (userData.count >= 5) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: `Maximum number of OTP sent times has been reached`,
      error: "Maximum number of OTP sent times has been reached",
      statusCode: 403,
      type: ERROR_SESSION,
    };
    return dataResponse;
  }
  // Kiểm tra thời gian sống của key
  const ttl = await client.TTL(verifyOtpCookie);
  // Chỉ có thể resend sau 60s
  if (ttl > 240) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: `You can request a new verify OTP after ${ttl - 240} seconds`,
      error: "Not can request a new verify OTP",
      statusCode: 403,
      type: ERROR_CLIENT,
    };
    return dataResponse;
  }
  try {
    // Thực hiện việc resend otp
    // Tạo random code mới
    const newRandomCode = Math.floor(100000 + Math.random() * 900000);
    // Tạo key mới
    const newKey = v4();
    await client.set(
      newKey,
      JSON.stringify({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        randomCode: newRandomCode,
        count: userData.count + 1,
        fail: userData.fail,
      }),
      {
        EX: 300,
      }
    );
    await client.del(verifyOtpCookie)
    // Send HTML Content
    const emailBody = await generateRegisterMail(userData.email, newRandomCode);
    // Send Email
    const subject = "Verify OTP for register";
    await sendEmail(userData.email, subject, emailBody);
    // Response
    let dataResponse: SuccessResponse = {
      success: true,
      message: "Verify OTP for register",
      data: { newKey },
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Error when resend new verify OTP",
      error: error as string,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleVerifyOTPService = async ({
  otpCode,
  verifyOtpCookie,
}: {
  otpCode: string;
  verifyOtpCookie: string;
}) => {
  const client = await connectRedis();
  const data = await client.get(verifyOtpCookie);
  if (!data) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Session expired",
      error: "Session expired",
      statusCode: 401,
      type: ERROR_SESSION,
    };
    return dataResponse;
  }
  // Nếu có dữ liệu, chuyển từ chuỗi JSON về Object
  const userData: {
    username: string;
    password: string;
    email: string;
    randomCode: number;
    count: number;
    fail: number;
  } = JSON.parse(data);
  if (!userData.username) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Invalid Session",
      error: "Invalid Session",
      statusCode: 401,
      type: ERROR_SESSION,
    };
    return dataResponse;
  }
  if (otpCode.toString() !== userData.randomCode.toString()) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Invalid OTP Code",
      error: "Invalid OTP Code",
      statusCode: 401,
      type: ERROR_SESSION,
    };
    return dataResponse;
  }
  try {
    // OTP is correct, delete the Redis key
    await client.del(verifyOtpCookie);
    // Save User to Database
    const hashedPassword = await hash(userData.password, 10);
    await connectMongoDB();
    const newUser = await User.create({
      username: userData.username,
      password: hashedPassword,
      email: userData.email,
    });

    await newUser.save();

    let dataResponse: SuccessResponse = {
      success: true,
      message: "User saved successfully",
      data: newUser,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Error when create user",
      error: error as string,
      statusCode: 500,
      type: ERROR_SESSION,
    };
    return dataResponse;
  }
};

export const handleRecoveryPasswordService = async ({
  email,
}: {
  email: string;
}) => {
  await connectMongoDB();
  // Check exist email and username
  const existingEmail = await User.findOne({ email });
  if (!existingEmail) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Email not found",
      error: "Email not found",
      statusCode: 404,
      type: ERROR_CLIENT,
    };
    return dataResponse;
  }
  try {
    // Tạo random code
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    // Tạo uuid chứa OTP và thông tin đăng ký
    const id = v4();
    const client = await connectRedis();
    client.set(id, JSON.stringify({ email, randomCode }), {
      EX: 300,
    });
    // Send HTML Content
    const emailBody = await generateRecoveryPasswordMail(email, randomCode);
    // Send Email
    const subject = "Recovery Password in Pet Paradise";
    await sendEmail(email, subject, emailBody);
    // Response
    let dataResponse: SuccessResponse = {
      success: true,
      message: "Verify OTP for recovery password of account",
      data: { id },
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Error when sending email for recovery password",
      error: error as string,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleVerifyOTPRecoveryService = async ({
  otpCode,
  verifyOtpCookie,
}: {
  otpCode: string;
  verifyOtpCookie: string;
}) => {
  const client = await connectRedis();
  const data = await client.get(verifyOtpCookie);
  if (!data) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Session expired",
      error: "Session expired",
      statusCode: 401,
      type: ERROR_SESSION,
    };
    return dataResponse;
  }
  // Nếu có dữ liệu, chuyển từ chuỗi JSON về Object
  const infoEmail: {
    email: string;
    randomCode: number;
  } = JSON.parse(data);
  if (otpCode.toString() !== infoEmail.randomCode.toString()) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Invalid OTP Code",
      error: "Invalid OTP Code",
      statusCode: 401,
      type: ERROR_SESSION,
    };
    return dataResponse;
  }
  try {
    // OTP is correct, delete the Redis key
    await client.del(verifyOtpCookie);
    // Add key confirm_password
    const confirmPasswordID = v4();
    await client.set(
      confirmPasswordID,
      JSON.stringify({ email: infoEmail.email }),
      { EX: 300 }
    );
    // Response to Controllers
    let dataResponse: SuccessResponse = {
      success: true,
      message: "Check otp code successfully",
      data: { id: confirmPasswordID },
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Error when checking otp code",
      error: error as string,
      statusCode: 500,
      type: ERROR_SESSION,
    };
    return dataResponse;
  }
};

export const handleConfirmPasswordService = async ({
  password,
  confirmPasswordCookie,
}: {
  password: string;
  confirmPasswordCookie: string;
}) => {
  const client = await connectRedis();
  const data = await client.get(confirmPasswordCookie);
  if (!data) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Session expired",
      error: "Session expired",
      statusCode: 401,
      type: ERROR_SESSION,
    };
    return dataResponse;
  }
  // Nếu có dữ liệu, chuyển từ chuỗi JSON về Object
  const dataRedis: { email: string } = JSON.parse(data);
  // Sau khi lấy ra đươc email và có password, tiến hành cập nhật password
  const hashedPassword = await hash(password, 10);
  await connectMongoDB();
  // Tìm người dùng bằng email và cập nhật password
  const updatedUser = await User.findOneAndUpdate(
    { email: dataRedis.email },
    { password: hashedPassword },
    { new: true }
  );

  // Kiểm tra xem việc cập nhật có thành công không
  if (!updatedUser) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "User not found or update failed",
      error: "User not found or update failed",
      statusCode: 404,
      type: ERROR_CLIENT,
    };
    return dataResponse;
  }

  // Nếu cập nhật thành công, xóa dữ liệu trong Redis
  await client.del(confirmPasswordCookie);
  // Trả về kết quả thành công
  let dataResponse: SuccessResponse = {
    success: true,
    message: "Password updated successfully",
    data: null, // Không cần gửi thông tin người dùng trong phản hồi này
    statusCode: 200,
    type: SUCCESS,
  };
  return dataResponse;
};

export const handleLoginService = async ({
  email,
  password: inputPassword,
}: {
  email: string;
  password: string;
}) => {
  try {
    await connectMongoDB();
    // Tìm kiếm người dùng theo email
    const user = await User.findOne({ email: email });
    // Kiểm tra xem người dùng có tồn tại không
    if (!user) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "User not found",
        error: "User with the given email does not exist",
        statusCode: 404,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }
    // So sánh mật khẩu đã nhập với mật khẩu đã băm
    const isMatch = await bcrypt.compare(inputPassword, user.password);
    // Kiểm tra xem mật khẩu có khớp không
    if (!isMatch) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Invalid credentials: incorrect password",
        error: "Password does not match",
        statusCode: 401,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }

    // Nếu mật khẩu khớp, trả về phản hồi thành công
    const { password, ...userWithoutPassword } = user.toObject();
    // Generate Token
    const { value: token, jti } = jwtHelper.generateToken({
      username: user.username,
      email: user.email,
      id: user._id.toString(),
    });
    // Connect Redis
    const client = await connectRedis();
    // Lưu token vào Redis
    client.set(jti, token, {
      EX: jwtHelper.getExpiryDurationToken(token),
    });
    // Lưu thông tin RefreshToken vào danh sách phiên
    client.sAdd(user._id.toString(), jti);
    // Trả về thông tin
    let dataResponse: SuccessResponse = {
      success: true,
      message: "Login successful",
      data: { user: userWithoutPassword, jti, token },
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Error when login, please try again",
      error: error as string,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};
