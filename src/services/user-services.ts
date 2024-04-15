import { ERROR_CLIENT, ERROR_SERVER, SUCCESS } from "../constants";
import { connectMongoDB } from "../db/mongodb";
import { ErrorResponse, SuccessResponse } from "../types";
import User, { IUserDocument } from "../models/user";
import bcrypt from "bcryptjs";
import cloudinary from "../utils/cloudinary-config";
import Post from "../models/post";
import { connectRedis } from "../db/redis";

export const handleGetUserService = async ({
  user,
}: {
  user: { id: string; username: string; email: string };
}) => {
  try {
    await connectMongoDB();
    const userInfo: IUserDocument | null = await User.findById(
      user.id
    ).populate({
      path: "likedPosts savedPosts",
      model: Post,
      populate: {
        path: "poster",
        model: User,
        select: "-password", // Loại bỏ trường password từ kết quả
      },
    });
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

export const handleLikePostService = async ({
  user,
  postID,
}: {
  user: { id: string; email: string; username: string };
  postID: string;
}) => {
  try {
    await connectMongoDB();
    /** Lấy thông tin user và post */
    const userInfo = await User.findById(user.id).populate({
      path: "likedPosts",
      model: Post,
    });
    const postInfo = await Post.findById(postID).populate({
      path: "likes",
      model: User,
    });
    /** Kiểm tra xem post tồn tại hay không */
    if (!postInfo || !userInfo) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Not found",
        error: "Not found",
        statusCode: 404,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }
    /** Kiểm tra trạng thái like hay unlike */
    const isLiked = userInfo?.likedPosts.find(
      (post) => post._id.toString() === postID
    );
    if (isLiked) {
      userInfo.likedPosts = userInfo.likedPosts.filter(
        (item) => item._id.toString() !== postID
      );
      postInfo.likes = postInfo.likes.filter(
        (item) => item._id.toString() !== user.id.toString()
      );
    } else {
      userInfo.likedPosts.push(postInfo);
      postInfo.likes.push(userInfo);
    }
    await userInfo.save();
    await postInfo.save();
    let dataResponse: SuccessResponse = {
      success: true,
      message: "Like success",
      data: userInfo,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Fail when like post",
      error: "Fail when like post: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleSavePostService = async ({
  user,
  postID,
}: {
  user: { id: string; email: string; username: string };
  postID: string;
}) => {
  try {
    await connectMongoDB();
    /** Lấy thông tin user và post */
    const userInfo = await User.findById(user.id).populate({
      path: "savedPosts",
      model: Post,
    });
    const postInfo = await Post.findById(postID).populate({
      path: "saves",
      model: User,
    });
    /** Kiểm tra xem post tồn tại hay không */
    if (!postInfo || !userInfo) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Not found",
        error: "Not found",
        statusCode: 404,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }
    /** Kiểm tra trạng thái save hay unsave */
    const isSaved = userInfo.savedPosts.find(
      (post) => post._id.toString() === postID
    );
    if (isSaved) {
      userInfo.savedPosts = userInfo.savedPosts.filter(
        (item) => item._id.toString() !== postID
      );
      postInfo.saves = postInfo.saves.filter(
        (item) => item._id.toString() !== user.id.toString()
      );
    } else {
      userInfo.savedPosts.push(postInfo);
      postInfo.saves.push(userInfo);
    }
    await userInfo.save();
    await postInfo.save();
    let dataResponse: SuccessResponse = {
      success: true,
      message: "Save success",
      data: userInfo,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Fail when save post",
      error: "Fail when save post: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleGetOtherUserService = async ({
  user,
  limit,
  offset,
}: {
  user: { id: string; username: string; email: string };
  limit: number;
  offset: number;
}) => {
  try {
    await connectMongoDB();
    // Truy vấn để lấy các người dùng khác không bao gồm người dùng hiện tại
    const otherUsers = await User.find({ _id: { $ne: user.id } }) // Sử dụng $ne để loại trừ người dùng hiện tại
      .skip(offset)
      .limit(limit)
      .select("-password -chats -email -savedPosts -likedPosts") // Loại bỏ các trường nhạy cảm
      .exec();
    // Return
    let dataResponse: SuccessResponse = {
      success: true,
      message: "Successfully retrieved other users",
      data: otherUsers,
      statusCode: 200,
      type: SUCCESS,
    };

    return dataResponse;
  } catch (error: any) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Fail when to get other user",
      error: "Fail when to get other user: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleFollowService = async ({
  user,
  peopleID,
}: {
  user: { id: string; email: string; username: string };
  peopleID: string;
}) => {
  if (user.id === peopleID) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Can not follow user",
      error: "Can not follow user: ",
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return dataResponse;
  }
  try {
    await connectMongoDB();
    const userInfo = await User.findById(user.id)
      .populate({
        path: "followers following",
        model: User,
      })
      .select("-password")
      .exec();
    const otherPeopleInfo = await User.findById(peopleID)
      .populate({
        path: "followers following",
        model: User,
      })
      .select("-password")
      .exec();
    if (!userInfo || !otherPeopleInfo) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Not found user",
        error: "Not found user",
        statusCode: 404,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }
    /** Kiểm tra trạng thái đã follow của người dùng */
    const isFollowing = userInfo.following.find(
      (item) => item._id.toString() === peopleID.toString()
    );
    let tmp: number = 0;
    if (isFollowing) {
      tmp = 1;
      userInfo.following = userInfo.following.filter(
        (item) => item._id.toString() !== peopleID.toString()
      );
      otherPeopleInfo.followers = otherPeopleInfo.followers.filter(
        (item) => item._id.toString() !== user.id.toString()
      );
    } else {
      tmp = 2;
      userInfo.following.push(otherPeopleInfo);
      otherPeopleInfo.followers.push(userInfo);
    }
    await userInfo.save();
    await otherPeopleInfo.save();
    let dataResponse: SuccessResponse = {
      success: true,
      message: "Handle follow success",
      data: `${tmp == 1 ? "Unfollow" : "Follow"}`,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Fail when follow user",
      error: "Fail when follow user: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleLogoutService = async ({
  user,
  tokenId,
}: {
  user: { id: string; username: string; email: string };
  tokenId: string;
}) => {
  try {
    const client = await connectRedis();
    /** Xóa tokenId */
    await client.del(tokenId.toString());
    /** Xóa tokenId khỏi SET chứa danh sách tokenId của người dùng */
    await client.sRem(`${user.id.toString()}`, tokenId.toString());
    let dataResponse: SuccessResponse = {
      success: true,
      message: "Logout success",
      data: "Logout success",
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Fail when logout, please try again",
      error: "Fail when logout: " + error?.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};
