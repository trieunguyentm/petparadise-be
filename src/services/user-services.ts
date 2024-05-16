import { ERROR_CLIENT, ERROR_SERVER, SUCCESS } from "../constants";
import { connectMongoDB } from "../db/mongodb";
import { ErrorResponse, SuccessResponse } from "../types";
import User, { IUserDocument } from "../models/user";
import bcrypt from "bcryptjs";
import cloudinary from "../utils/cloudinary-config";
import Post from "../models/post";
import { connectRedis } from "../db/redis";
import { normalizeQuery } from "../utils/normalize";
import CommentModel from "../models/comment";
import Notification from "../models/notification";
import { pusherServer } from "../utils/pusher";

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
      populate: [
        {
          path: "poster",
          model: "User",
          select: "-password", // Loại bỏ trường password từ kết quả
        },
        {
          path: "comments",
          model: CommentModel,
          options: { sort: { createdAt: -1 } },
          populate: {
            path: "poster",
            model: "User",
            select: "-password",
          },
        },
      ],
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

    if (!isLiked) {
      const notification = new Notification({
        receiver: postInfo.poster._id,
        status: "unseen",
        title: "New activity",
        subtitle: `${user.username} liked your post`,
        moreInfo: `/post/${postID}`,
      });
      await notification.save();

      // Pusher: Send the notification
      await pusherServer.trigger(
        `user-${postInfo.poster._id.toString()}-notifications`,
        `new-notification`,
        notification
      );
    }

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

export const handleGetOtherUserBySearchService = async ({
  user,
  search,
  limit,
  offset,
}: {
  user: { id: string; username: string; email: string };
  search: string;
  limit: number;
  offset: number;
}) => {
  try {
    await connectMongoDB();
    // Truy vấn để lấy các người dùng có username chứa chuỗi tìm kiếm và loại trừ người dùng hiện tại
    const otherUsers = await User.find({
      _id: { $ne: user.id },
      username: { $regex: search, $options: "i" }, // $regex cung cấp khả năng tìm kiếm mềm dẻo, $options: 'i' để không phân biệt hoa thường
    })
      .skip(offset)
      .limit(limit)
      .select("-password -chats -email -savedPosts -likedPosts") // Loại bỏ các trường nhạy cảm
      .exec();

    // Return
    let dataResponse: SuccessResponse = {
      success: true,
      message: "Successfully retrieved other users based on search",
      data: otherUsers,
      statusCode: 200,
      type: "SUCCESS",
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
      message: "Cannot follow yourself",
      error: "Cannot follow yourself",
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return dataResponse;
  }

  try {
    await connectMongoDB();
    const userInfo = await User.findById(user.id)
      .populate({ path: "followers following", model: User })
      .select("-password")
      .exec();
    const otherPeopleInfo = await User.findById(peopleID)
      .populate({ path: "followers following", model: User })
      .select("-password")
      .exec();

    if (!userInfo || !otherPeopleInfo) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "User not found",
        error: "User not found",
        statusCode: 404,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }

    /** Kiểm tra trạng thái đã follow của người dùng */
    const isFollowing = userInfo.following.find(
      (item) => item._id.toString() === peopleID.toString()
    );

    let action: string;

    if (isFollowing) {
      action = "Unfollow";
      userInfo.following = userInfo.following.filter(
        (item) => item._id.toString() !== peopleID.toString()
      );
      otherPeopleInfo.followers = otherPeopleInfo.followers.filter(
        (item) => item._id.toString() !== user.id.toString()
      );
    } else {
      action = "Follow";
      userInfo.following.push(otherPeopleInfo);
      otherPeopleInfo.followers.push(userInfo);
    }

    await userInfo.save();
    await otherPeopleInfo.save();
    // Nếu Follow (tmp === 2) tạo notification
    if (action === "Follow") {
      // Create a notification
      const notification = new Notification({
        receiver: otherPeopleInfo._id,
        status: "unseen",
        title: "New Follower",
        subtitle: `${user.username} started following you`,
      });
      await notification.save();

      // Pusher: Send the notification
      await pusherServer.trigger(
        `user-${otherPeopleInfo._id.toString()}-notifications`,
        `new-notification`,
        notification
      );
    }

    let dataResponse: SuccessResponse = {
      success: true,
      message: "Handle follow success",
      data: action,
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

export const handleGetNotificationService = async ({
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
    // Fetch notifications for the user with pagination and sort by createdAt in descending order
    const notifications = await Notification.find({ receiver: user.id })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .exec();
    // Count total notifications for the user
    const totalNotifications = await Notification.countDocuments({
      receiver: user.id,
    });

    let dataResponse: SuccessResponse = {
      success: true,
      message: "Fetched notifications successfully",
      data: {
        notifications,
        total: totalNotifications,
        limit,
        offset,
      },
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.error(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Failed to fetch notifications",
      error: "Failed to fetch notifications: " + error.message,
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

export const handleLogoutAllDeviceService = async ({
  user,
  tokenId,
}: {
  user: { id: string; username: string; email: string };
  tokenId: string;
}) => {
  try {
    const client = await connectRedis();
    // Lấy tất cả các tokenId của người dùng
    const tokenIds = await client.sMembers(`${user.id}`);
    // Xóa tất cả các tokenId trong Redis
    const deletePromises: any = tokenIds.map((tokenId) => client.del(tokenId));
    await Promise.all(deletePromises);

    // Xóa SET chứa danh sách tokenId của người dùng
    await client.del(`${user.id}`);

    let dataResponse: SuccessResponse = {
      success: true,
      message: "Logout all device success",
      data: "Logout all device success",
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Fail when logout all device, please try again",
      error: "Fail when logout all device: " + error?.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleSearchUserService = async ({ query }: { query: string }) => {
  try {
    await connectMongoDB();
    const newQuery = normalizeQuery(query);
    const regexPattern = new RegExp(newQuery, "i");
    const searchedUser = await User.find({
      $or: [
        { username: { $regex: regexPattern } },
        { email: { $regex: regexPattern } },
      ],
    })
      .select("-password")
      .exec();

    const dataResponse: SuccessResponse = {
      success: true,
      message: "Search user successfully",
      data: searchedUser,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Failed to search user",
      error: "Failed to search user: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};
