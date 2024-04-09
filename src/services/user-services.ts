import { ERROR_CLIENT, ERROR_SERVER, SUCCESS } from "../constants";
import { connectMongoDB } from "../db/mongodb";
import { ErrorResponse, SuccessResponse } from "../types";
import User, { IUserDocument } from "../models/user";
import bcrypt from "bcryptjs";
import cloudinary from "../utils/cloudinary-config";

export const handleGetUserService = async ({
  user,
}: {
  user: { id: string; username: string; email: string };
}) => {
  try {
    await connectMongoDB();
    const userInfo: IUserDocument | null = await User.findById(user.id);
    if (!userInfo) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "User not found",
        error: "User not found",
        statusCode: 404,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    } else {
      const { password, ...userWithOutPassword } = userInfo.toObject();
      let dataResponse: SuccessResponse = {
        success: true,
        message: "Get user information successfully",
        data: userWithOutPassword,
        statusCode: 200,
        type: SUCCESS,
      };
      return dataResponse;
    }
  } catch (error) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Fail when to get info user",
      error: "Fail when to get info user",
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleChangePasswordService = async ({
  user,
  currentPassword,
  newPassword,
}: {
  user: { id: string; email: string; username: string };
  currentPassword: string;
  newPassword: string;
}) => {
  try {
    await connectMongoDB();
    let userInfo: IUserDocument | null = await User.findById(user.id);
    if (!userInfo) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "User not found",
        error: "User not found",
        statusCode: 404,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    } else {
      const isCorrect = await bcrypt.compare(
        currentPassword,
        userInfo.password
      );
      if (!isCorrect) {
        let dataResponse: ErrorResponse = {
          success: false,
          message: "Password is incorrect",
          error: "Password is incorrect",
          statusCode: 400,
          type: ERROR_CLIENT,
        };
        return dataResponse;
      }
      // Mật khẩu chính xác
      else {
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        userInfo.password = hashedNewPassword;
        // Lưu tài khoản
        await userInfo?.save();
        const { password, ...userWithOutPassword } = userInfo.toObject();
        let dataResponse: SuccessResponse = {
          success: true,
          message: "Change password successfully",
          data: userWithOutPassword,
          statusCode: 200,
          type: SUCCESS,
        };
        return dataResponse;
      }
    }
  } catch (error) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Fail when to change password, please try again",
      error: "Fail when to change password",
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleUpdateService = async ({
  user,
  file,
}: {
  user: { id: string; username: string; email: string };
  file: Express.Multer.File;
}) => {
  try {
    // Cần một cách để chuyển đổi file.buffer sang stream
    const uploadResponse: any = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "user_avatar" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.write(file.buffer);
      stream.end();
    });

    // Cập nhật URL avatar trong cơ sở dữ liệu
    await connectMongoDB();
    const updatedUser = await User.findByIdAndUpdate(
      user.id,
      { profileImage: uploadResponse.url }, // Sử dụng URL nhận được từ Cloudinary
      { new: true }
    );
    if (!updatedUser) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Update fail",
        error: "Update fail",
        statusCode: 500,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }
    const { password, ...userWithOutPassword } = updatedUser.toObject();
    let dataResponse: SuccessResponse = {
      success: true,
      message: "User profile updated successfully",
      data: userWithOutPassword,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Fail when to update user",
      error: "Fail when to update user",
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};
