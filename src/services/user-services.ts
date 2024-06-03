import { ERROR_CLIENT, ERROR_SERVER, SUCCESS } from "../constants";
import { connectMongoDB } from "../db/mongodb";
import { ErrorResponse, SuccessResponse, TypePet } from "../types";
import User, { IUserDocument } from "../models/user";
import bcrypt from "bcryptjs";
import cloudinary from "../utils/cloudinary-config";
import Post from "../models/post";
import { connectRedis } from "../db/redis";
import { normalizeQuery } from "../utils/normalize";
import CommentModel from "../models/comment";
import Notification from "../models/notification";
import { pusherServer } from "../utils/pusher";
import { Stream } from "stream";
import Product from "../models/product";
import path from "path";
import { model } from "mongoose";

const uploadImage = async (file: Express.Multer.File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Tạo một stream upload từ Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "avatar" },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (!result) {
          reject(new Error("Upload failed without a specific error."));
        } else {
          resolve(result.url); // Khi upload thành công, trả về URL của ảnh
        }
      }
    );

    // Tạo một stream từ buffer của file và pipe nó vào stream upload của Cloudinary
    const bufferStream = new Stream.PassThrough();
    bufferStream.end(file.buffer);
    bufferStream.pipe(uploadStream);
  });
};

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
  location,
  typePet,
}: {
  user: { id: string; username: string; email: string };
  file: Express.Multer.File | undefined;
  location: string | undefined;
  typePet: TypePet[];
}) => {
  try {
    await connectMongoDB();
    const updates: Partial<IUserDocument> = {};
    // Handle profile image update
    if (file !== undefined) {
      const imageUrl = await uploadImage(file);
      updates.profileImage = imageUrl;
    }
    // Handle location update
    if (location) {
      const [cityName, districtName, wardName] = location.split("-");
      if (cityName && districtName && wardName) {
        updates.address = location;
      }
    }
    // Handle pet type update
    if (typePet.length > 0) {
      updates.petTypeFavorites = typePet;
    }
    // Perform update if there are any changes
    if (Object.keys(updates).length > 0) {
      const userUpdated = await User.findByIdAndUpdate(user.id, updates, {
        new: true,
      })
        .select("-password")
        .exec();

      if (userUpdated) {
        return {
          success: true,
          message: "User profile updated successfully",
          data: userUpdated,
          statusCode: 200,
          type: SUCCESS,
        };
      } else {
        return {
          success: false,
          message: "User not found",
          error: "Fail when to update user",
          statusCode: 404,
          type: ERROR_CLIENT,
        };
      }
    } else {
      return {
        success: false,
        message: "Please provide information to update",
        error: "No update data provided",
        statusCode: 400,
        type: ERROR_CLIENT,
      };
    }
  } catch (error: any) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Fail when to update user",
      error: "Fail when to update user" + error.message,
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

    if (
      !isLiked &&
      userInfo._id.toString() !== postInfo.poster._id.toString()
    ) {
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
      .sort({ createdAt: -1 })
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

export const handleSeenNotificationService = async ({
  user,
  notificationId,
}: {
  user: { username: string; email: string; id: string };
  notificationId: string;
}) => {
  try {
    await connectMongoDB();
    // Tìm notification theo id
    const notification = await Notification.findById(notificationId)
      .populate("receiver")
      .select("-password");

    if (!notification) {
      return {
        success: false,
        message: "Notification not found",
        error: "Notification not found",
        statusCode: 404,
        type: ERROR_CLIENT,
      } as ErrorResponse;
    }
    // Kiểm tra quyền của user
    if (notification.receiver._id.toString() !== user.id) {
      return {
        success: false,
        message: "Unauthorized access",
        error: "You are not authorized to see this notification",
        statusCode: 403,
        type: ERROR_CLIENT,
      } as ErrorResponse;
    }
    if (notification.status === "seen") {
      return {
        success: false,
        message: "Notification seen",
        error: "You can not seen because this notification is already seen",
        statusCode: 400,
        type: ERROR_CLIENT,
      } as ErrorResponse;
    }
    // Cập nhật trạng thái của notification thành "seen"
    notification.status = "seen";
    await notification.save();
    const dataResponse: SuccessResponse = {
      success: true,
      message: "Notification seen successfully",
      data: notification,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Fail when seen notification",
      error: "Fail when seen notification: " + error.message,
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

export const handleGetCartService = async ({
  user,
}: {
  user: { id: string; username: string; email: string };
}) => {
  try {
    await connectMongoDB();

    const userWithCart = await User.findById(user.id).populate({
      path: "cart.product",
      model: Product,
      populate: {
        path: "seller",
        model: User,
        select: "username email profileImage",
      },
    });

    let dataResponse: SuccessResponse = {
      success: true,
      message: "Get Cart Successfully",
      data: userWithCart?.cart,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Fail when get item in cart",
      error: "Fail when get item in cart: " + error?.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};
