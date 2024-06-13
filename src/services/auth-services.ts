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
      message: "Địa chỉ gmail đã tồn tại",
      error: "Địa chỉ gmail đã tồn tại",
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return dataResponse;
  }
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Tên người dùng đã tồn tại",
      error: "Tên người dùng đã tồn tại",
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
    const subject = "Xác minh mã OTP đăng ký tài khoản PetParadise";
    await sendEmail(email, subject, emailBody);
    // Response
    let dataResponse: SuccessResponse = {
      success: true,
      message: "Xác minh mã OTP đăng ký tài khoản PetParadise",
      data: { id },
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi gửi thư đến gmail đăng ký",
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
      message: "Phiên hết hạn",
      error: "Phiên hết hạn",
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
      message: "Phiên không hợp lệ",
      error: "Phiên không hợp lệ",
      statusCode: 401,
      type: ERROR_SESSION,
    };
    return dataResponse;
  }
  // Kiểm tra số lần resend
  if (userData.count >= 5) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: `Đã đạt đến số lần gửi OTP tối đa`,
      error: "Đã đạt đến số lần gửi OTP tối đa",
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
      message: `Bạn có thể gửi yêu cầu nhận OTP mới sau ${ttl - 240} giây`,
      error: "Hiện tại chưa thể nhận OTP mới",
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
    await client.del(verifyOtpCookie);
    // Send HTML Content
    const emailBody = await generateRegisterMail(userData.email, newRandomCode);
    // Send Email
    const subject = "Xác minh mã OTP đăng ký tài khoản PetParadise";
    await sendEmail(userData.email, subject, emailBody);
    // Response
    let dataResponse: SuccessResponse = {
      success: true,
      message: "Xác minh mã OTP đăng ký tài khoản PetParadise",
      data: { newKey },
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi gửi lại mã OTP mới",
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
      message: "Phiên hết hạn",
      error: "Phiên hết hạn",
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
      message: "Phiên không hợp lệ",
      error: "Phiên không hợp lệ",
      statusCode: 401,
      type: ERROR_SESSION,
    };
    return dataResponse;
  }
  if (otpCode.toString() !== userData.randomCode.toString()) {
    if (userData.fail >= 5) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Số lần nhập OTP sai đã vượt quá 5 lần",
        error: "Mã OTP không chính xác",
        statusCode: 403,
        type: ERROR_SESSION,
      };
      await client.del(verifyOtpCookie);
      return dataResponse;
    }
    const ttl = await client.TTL(verifyOtpCookie);
    await client.set(
      verifyOtpCookie,
      JSON.stringify({
        username: userData.username,
        mail: userData.email,
        password: userData.password,
        randomCode: userData.randomCode,
        count: userData.count,
        fail: userData.fail + 1,
      }),
      {
        EX: ttl,
      }
    );
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Mã OTP không chính xác",
      error: "Mã OTP không chính xác",
      statusCode: 401,
      type: ERROR_CLIENT,
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
      message: "Người dùng đã được tạo thành công",
      data: newUser,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi tạo người dùng",
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
      message: "Không tìm thấy địa chỉ gmail này",
      error: "Không tìm thấy địa chỉ gmail này",
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
    client.set(id, JSON.stringify({ email, randomCode, count: 0, fail: 0 }), {
      EX: 300,
    });
    // Send HTML Content
    const emailBody = await generateRecoveryPasswordMail(email, randomCode);
    // Send Email
    const subject = "Khôi phục mật khẩu trên PetParadise";
    await sendEmail(email, subject, emailBody);
    // Response
    let dataResponse: SuccessResponse = {
      success: true,
      message: "Xác minh mã OTP cho việc khôi phục tài khoản",
      data: { id },
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi gửi thư đến gmail đăng ký",
      error: error as string,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleResendVerifyOTPRecoveryService = async ({
  verifyOtpRecoveryCookie,
}: {
  verifyOtpRecoveryCookie: string;
}) => {
  const client = await connectRedis();
  const data = await client.get(verifyOtpRecoveryCookie);
  if (!data) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Phiên hết hạn",
      error: "Phiên hết hạn",
      statusCode: 401,
      type: ERROR_SESSION,
    };
    return dataResponse;
  }
  // Nếu có dữ liệu, chuyển từ JSON về Object
  const userData: {
    email: string;
    randomCode: number;
    count: number;
    fail: number;
  } = JSON.parse(data);
  if (!userData.email) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Phiên không hợp lệ",
      error: "Phiên không hợp lệ",
      statusCode: 401,
      type: ERROR_SESSION,
    };
    return dataResponse;
  }
  // Kiểm tra số lần resend
  if (userData.count >= 5) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: `Đã đạt đến số lần gửi OTP tối đa`,
      error: "Đã đạt đến số lần gửi OTP tối đa",
      statusCode: 403,
      type: ERROR_SESSION,
    };
    return dataResponse;
  }
  // Kiểm tra thời gian còn sống của key
  const ttl = await client.TTL(verifyOtpRecoveryCookie);
  // Chỉ có thể resend sau 60s
  if (ttl > 240) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: `Chỉ có thể yêu cầu mã OTP mới sau ${ttl - 240} giây`,
      error: "Không thể yêu cầu tạo OTP mới",
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
        email: userData.email,
        randomCode: newRandomCode,
        count: userData.count + 1,
        fail: userData.fail,
      }),
      {
        EX: 300,
      }
    );
    await client.del(verifyOtpRecoveryCookie);
    // Send HTML Content
    const emailBody = await generateRecoveryPasswordMail(
      userData.email,
      newRandomCode
    );
    // Send Email
    const subject = "Khôi phục mật khẩu trên PetParadise";
    await sendEmail(userData.email, subject, emailBody);
    // Response
    let dataResponse: SuccessResponse = {
      success: true,
      message: "Xác minh mã OTP cho việc khôi phục tài khoản",
      data: { newKey },
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi gửi lại mã OTP mới",
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
      message: "Phiên hết hạn",
      error: "Phiên hết hạn",
      statusCode: 401,
      type: ERROR_SESSION,
    };
    return dataResponse;
  }
  // Nếu có dữ liệu, chuyển từ chuỗi JSON về Object
  const infoEmail: {
    email: string;
    randomCode: number;
    count: number;
    fail: number;
  } = JSON.parse(data);
  if (!infoEmail.email) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Phiên không hợp lệ",
      error: "Phiên không hợp lệ",
      statusCode: 401,
      type: ERROR_SESSION,
    };
    return dataResponse;
  }
  if (otpCode.toString() !== infoEmail.randomCode.toString()) {
    if (infoEmail.fail >= 5) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Số lần nhập OTP sai đã vượt quá 5 lần",
        error: "Số lần nhập OTP sai đã vượt quá 5 lần",
        statusCode: 403,
        type: ERROR_SESSION,
      };
      await client.del(verifyOtpCookie);
      return dataResponse;
    }
    const ttl = await client.TTL(verifyOtpCookie);
    await client.set(
      verifyOtpCookie,
      JSON.stringify({
        email: infoEmail.email,
        randomCode: infoEmail.randomCode,
        count: infoEmail.count,
        fail: infoEmail.fail + 1,
      }),
      {
        EX: ttl,
      }
    );
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Mã OTP không chính xác",
      error: "Mã OTP không chính xác",
      statusCode: 401,
      type: ERROR_CLIENT,
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
      message: "OTP chính xác",
      data: { id: confirmPasswordID },
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi kiểm tra mã OTP",
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
      message: "Phiên hết hạn",
      error: "Phiên hết hạn",
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
      message: "Không tìm thấy người dùng hoặc việc cập nhật thất bại",
      error: "Không tìm thấy người dùng hoặc việc cập nhật thất bại",
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
    message: "Cập nhật mật khẩu mới thành công",
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
        message: "Người dùng không tồn tại",
        error: "Người dùng không tồn tại",
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
        message: "Mật khẩu không chính xác",
        error: "Mật khẩu không chính xác",
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
      message: "Đăng nhập thành công",
      data: { user: userWithoutPassword, jti, token },
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi đăng nhập, vui lòng thử lại",
      error: error as string,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};
