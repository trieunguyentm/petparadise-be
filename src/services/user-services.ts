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

const uploadImage = async (file: Express.Multer.File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Tạo một stream upload từ Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "avatar" },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (!result) {
          reject(new Error("Tải ảnh không thành công"));
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
        message: "Không tìm thấy người dùng",
        error: "Không tìm thấy người dùng",
        statusCode: 404,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    } else {
      const { password, ...userWithOutPassword } = userInfo.toObject();
      let dataResponse: SuccessResponse = {
        success: true,
        message: "Lấy thông tin người dùng thành công",
        data: userWithOutPassword,
        statusCode: 200,
        type: SUCCESS,
      };
      return dataResponse;
    }
  } catch (error) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi lấy thông tin người dùng",
      error: "Xảy ra lỗi khi lấy thông tin người dùng",
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
        message: "Không tìm thấy người dùng",
        error: "Không tìm thấy người dùng",
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
          message: "Mật khẩu không chính xác",
          error: "Mật khẩu không chính xác",
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
          message: "Thay đổi mật khẩu thành công",
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
      message: "Xảy ra lỗi khi thay đổi mật khẩu",
      error: "Xảy ra lỗi khi thay đổi mật khẩu",
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
  typePet: TypePet[] | undefined;
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
    if (typePet && typePet.length > 0) {
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
          message: "Thông tin người dùng đã được cập nhật",
          data: userUpdated,
          statusCode: 200,
          type: SUCCESS,
        };
      } else {
        return {
          success: false,
          message: "Không tìm thấy người dùng",
          error: "Không tìm thấy người dùng",
          statusCode: 404,
          type: ERROR_CLIENT,
        };
      }
    } else {
      return {
        success: false,
        message: "Không có thông tin cập nhật",
        error: "Không có thông tin cập nhật",
        statusCode: 400,
        type: ERROR_CLIENT,
      };
    }
  } catch (error: any) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi cập nhật thông tin",
      error: "Xảy ra lỗi khi cập nhật thông tin" + error.message,
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
        message: "Không tìm thấy bài đăng",
        error: "Không tìm thấy bài đăng",
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
        title: "Hoạt động mới",
        subtitle: `${user.username} đã thích bài viết của bạn`,
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
      message: "Thích bài viết thành công",
      data: userInfo,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi thích bài viết",
      error: "Xảy ra lỗi khi thích bài viết: " + error.message,
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
        message: "Không tìm thấy bài viết",
        error: "Không tìm thấy bài viết",
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
      message: "Lưu bài viết thành công",
      data: userInfo,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi lưu bài viết",
      error: "Xảy ra lỗi khi lưu bài viết: " + error.message,
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
      message: "Lấy danh sách người dùng khác thành công",
      data: otherUsers,
      statusCode: 200,
      type: SUCCESS,
    };

    return dataResponse;
  } catch (error: any) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi lấy danh sách người dùng",
      error: "Xảy ra lỗi khi lấy danh sách người dùng: " + error.message,
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
      message: "Lấy danh sách người dùng khác thành công",
      data: otherUsers,
      statusCode: 200,
      type: "SUCCESS",
    };
    return dataResponse;
  } catch (error: any) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi lấy danh sách người dùng",
      error: "Xảy ra lỗi khi lấy danh sách người dùng: " + error.message,
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
      message: "Không thể follow bản thân",
      error: "Không thể follow bản thân",
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
        message: "Không tìm thấy người dùng",
        error: "Không tìm thấy người dùng",
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
        title: "Người theo dõi mới",
        subtitle: `${user.username} đã theo dõi bạn`,
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
      message: "Xử lý theo dõi người dùng thành công",
      data: action,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi xử lý theo dõi người dùng",
      error: "Xảy ra lỗi khi xử lý theo dõi người dùng: " + error.message,
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
      message: "Lấy danh sách thông báo thành công",
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
      message: "Xảy ra lỗi khi lấy thông báo",
      error: "Xảy ra lỗi khi lấy thông báo: " + error.message,
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
        message: "Không tìm thấy thông báo",
        error: "Không tìm thấy thông báo",
        statusCode: 404,
        type: ERROR_CLIENT,
      } as ErrorResponse;
    }
    // Kiểm tra quyền của user
    if (notification.receiver._id.toString() !== user.id) {
      return {
        success: false,
        message: "Không có quyền truy cập",
        error: "Không có quyền truy cập",
        statusCode: 403,
        type: ERROR_CLIENT,
      } as ErrorResponse;
    }
    if (notification.status === "seen") {
      return {
        success: false,
        message: "Thông báo đã được xem",
        error: "Thông báo đã được xem",
        statusCode: 400,
        type: ERROR_CLIENT,
      } as ErrorResponse;
    }
    // Cập nhật trạng thái của notification thành "seen"
    notification.status = "seen";
    await notification.save();
    const dataResponse: SuccessResponse = {
      success: true,
      message: "Thông báo đã được xem",
      data: notification,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi xem thông báo",
      error: "Xảy ra lỗi khi xem thông báo: " + error.message,
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
      message: "Đăng xuất thành công",
      data: "Đăng xuất thành công",
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi đăng xuất, vui lòng thử lại",
      error: "Xảy ra lỗi khi đăng xuất, vui lòng thử lại: " + error?.message,
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
      message: "Đăng xuất khỏi tất cả thiết bị thành công",
      data: "Đăng xuất khỏi tất cả thiết bị thành công",
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    let dataResponse: ErrorResponse = {
      success: false,
      message:
        "Xảy ra lỗi khi đăng xuất khỏi tất cả các thiết bị, vui lòng thử lại",
      error:
        "Xảy ra lỗi khi đăng xuất khỏi tất cả các thiết bị, vui lòng thử lại: " +
        error?.message,
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
      message: "Tìm kiếm người dùng thành công",
      data: searchedUser,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi tìm kiếm người dùng",
      error: "Xảy ra lỗi khi tìm kiếm người dùng: " + error.message,
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

    if (!userWithCart) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Không tìm thấy người dùng",
        error: "Không tìm thấy người dùng",
        statusCode: 404,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }

    // Lọc các sản phẩm tồn tại
    const validCartItems = userWithCart.cart.filter((item) => item.product);

    // Cập nhật giỏ hàng của người dùng nếu có thay đổi
    if (validCartItems.length !== userWithCart.cart.length) {
      userWithCart.cart = validCartItems;
      await userWithCart.save();
    }

    let dataResponse: SuccessResponse = {
      success: true,
      message: "Lấy thông tin giỏ hàng thành công",
      data: validCartItems,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi lấy thông tin giỏ hàng",
      error: "Xảy ra lỗi khi lấy thông tin giỏ hàng: " + error?.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleAddFavoriteProductService = async ({
  user,
  productId,
}: {
  user: { id: string; username: string; email: string };
  productId: string;
}) => {
  try {
    await connectMongoDB();
    // Kiểm tra xem sản phẩm có tồn tại không
    const product = await Product.findById(productId);
    if (!product) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Không tìm thấy sản phẩm",
        error: "Không tìm thấy sản phẩm",
        statusCode: 404,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }
    // Lấy thông tin người dùng
    const userInfo = await User.findById(user.id);
    if (!userInfo) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Không tìm thấy người dùng",
        error: "Không tìm thấy người dùng",
        statusCode: 404,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }

    // Kiểm tra xem sản phẩm đã có trong danh sách yêu thích chưa
    const isFavorite = userInfo.favoriteProducts.some(
      (favoriteProductId) => favoriteProductId.toString() === productId
    );

    if (isFavorite) {
      // Xóa sản phẩm khỏi danh sách yêu thích
      userInfo.favoriteProducts = userInfo.favoriteProducts.filter(
        (favoriteProductId) => favoriteProductId.toString() !== productId
      );
    } else {
      // Thêm sản phẩm vào danh sách yêu thích
      userInfo.favoriteProducts.push(product._id);
    }

    await userInfo.save();

    let dataResponse: SuccessResponse = {
      success: true,
      message: isFavorite
        ? "Sản phẩm đã bị xóa khỏi danh sách sản phẩm yêu thích"
        : "Sản phẩm đã được thêm vào danh sách sản phẩm yêu thích",
      data: userInfo,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Đã xảy ra lỗi khi thêm/xóa sản phẩm",
      error: "Đã xảy ra lỗi khi thêm/xóa sản phẩm: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleGetFavoriteProductService = async ({
  user,
}: {
  user: { id: string; username: string; email: string };
}) => {
  try {
    await connectMongoDB();

    // Lấy thông tin người dùng

    const userInfo = await User.findById(user.id)
      .populate({
        path: "favoriteProducts",
        model: Product,
      })
      .exec();

    let dataResponse: SuccessResponse = {
      success: true,
      message: "Lấy danh sách sản phẩm yêu thích thành công",
      data: {
        count: userInfo?.favoriteProducts.length,
        products: userInfo?.favoriteProducts,
      },
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi lấy danh sách sản phẩm yêu thích",
      error:
        "Xảy ra lỗi khi lấy danh sách sản phẩm yêu thích: " + error?.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};
