import { Stream } from "stream";
import cloudinary from "../utils/cloudinary-config";
import {
  ErrorResponse,
  GenderPet,
  SizePet,
  SuccessResponse,
  TypePet,
} from "../types";
import { ERROR_CLIENT, ERROR_SERVER, SUCCESS } from "../constants";
import { connectMongoDB } from "../db/mongodb";
import LostPetPost from "../models/lost-pet-post";
import User from "../models/user";
import FindPetCommentModel from "../models/find-pet-comment";
import { pusherServer } from "../utils/pusher";
import Notification from "../models/notification";
import notificationQueue from "../workers/notification-queue";

// Helper function to escape regex characters
function escapeRegex(text: string) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

const uploadImage = async (file: Express.Multer.File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Tạo một stream upload từ Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "image_pet" },
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

export const handleCreateFindPetPostService = async ({
  user,
  files,
  typePet,
  genderPet,
  sizePet,
  lastSeenLocation,
  lastSeenDate,
  description,
  contactInfo,
}: {
  user: { id: string; username: string; email: string };
  files: Express.Multer.File[];
  typePet: TypePet;
  genderPet: GenderPet;
  sizePet: SizePet;
  lastSeenLocation: string;
  lastSeenDate: Date;
  description: string;
  contactInfo: string;
}) => {
  try {
    // Hàm uploadImage để tải ảnh lên Cloudinary và trả về URL
    const imageUrls = await Promise.all(files.map((file) => uploadImage(file)));

    await connectMongoDB();

    let dataCreate: any = {
      poster: user.id,
      petType: typePet,
      lastSeenLocation,
      lastSeenDate,
      description,
      contactInfo,
      images: imageUrls,
    };
    if (genderPet) dataCreate = { ...dataCreate, gender: genderPet };
    if (sizePet) dataCreate = { ...dataCreate, size: sizePet };
    // Tạo bài đăng tìm thú cưng mới
    const newFindPetPost = await LostPetPost.create(dataCreate);

    const userInfo = await User.findById(user.id);
    userInfo?.findPetPosts.push(newFindPetPost);
    await userInfo?.save();

    // Thêm nhiệm vụ gửi thông báo vào hàng đợi
    await notificationQueue.add({
      type: "FIND_PET",
      data: {
        location: lastSeenLocation,
        typePet,
        user,
        newFindPetPost,
      },
    });

    const dataResponse: SuccessResponse = {
      success: true,
      message: "Tạo bài viết thành công",
      data: newFindPetPost,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi tạo bài viết tìm thú cưng",
      error: "Xảy ra lỗi khi tạo bài viết tìm thú cưng: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleGetFindPetPostService = async ({
  limit,
  offset,
}: {
  limit: number;
  offset: number;
}) => {
  try {
    await connectMongoDB();
    const findPetPosts = await LostPetPost.find()
      .skip(offset)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate({
        path: "poster",
        model: User,
        select: "-password",
      })
      .exec();
    const dataResponse: SuccessResponse = {
      success: true,
      message: "Lấy bài viết tìm thú cưng thành công",
      data: findPetPosts,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi tải bài viết",
      error: "Xảy ra lỗi khi tải bài viết: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleGetFindPetPostBySearchService = async ({
  petType,
  gender,
  size,
  lastSeenLocation,
  lastSeenDate,
  limit,
  offset,
}: {
  petType: "all" | TypePet;
  gender: "all" | GenderPet;
  size: "all" | SizePet;
  lastSeenLocation: string;
  lastSeenDate: Date | undefined;
  limit: number;
  offset: number;
}) => {
  let query: any = {};

  if (petType !== "all") query.petType = petType;
  if (gender !== "all") query.gender = gender;
  if (size !== "all") query.size = size;
  const [cityName, districtName, wardName] = lastSeenLocation.split("-");

  if (cityName) {
    query.lastSeenLocation = new RegExp("^" + escapeRegex(cityName), "i");
    if (districtName) {
      query.lastSeenLocation = new RegExp(
        "^" + escapeRegex(`${cityName}-${districtName}`),
        "i"
      );
      if (wardName) {
        query.lastSeenLocation = new RegExp(
          "^" + escapeRegex(`${cityName}-${districtName}-${wardName}`),
          "i"
        );
      }
    }
  }
  // Apply filter based on the date
  if (lastSeenDate) {
    const date = new Date(lastSeenDate);
    query.createdAt = { $gte: date };
  }
  try {
    await connectMongoDB();
    const posts = await LostPetPost.find(query)
      .skip(offset)
      .limit(limit)
      .populate("poster", "username profileImage")
      .sort({ createdAt: -1 }) // Sorting by creation time, latest first
      .exec();

    const dataResponse: SuccessResponse = {
      success: true,
      message: "Lấy thông tin bài viết thành công",
      data: posts,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi tải bài viết tìm thú cưng",
      error: "Xảy ra lỗi khi tải bài viết tìm thú cưng: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleGetFindPetPostByIdService = async ({
  postId,
}: {
  postId: string;
}) => {
  try {
    await connectMongoDB();
    const findPetPost = await LostPetPost.findById(postId)
      .populate({
        path: "poster",
        model: User,
        select: "username email profileImage",
      })
      .exec();

    const dataResponse: SuccessResponse = {
      success: true,
      message: "Lấy bài viết tìm thú cưng thành công",
      data: findPetPost,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi tải bài viết",
      error: "Xảy ra lỗi khi tải bài viết: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleUpdateFindPetPostByIdService = async ({
  postId,
  user,
}: {
  postId: string;
  user: { id: string; username: string; email: string };
}) => {
  try {
    await connectMongoDB();
    // Find the post by ID
    const post = await LostPetPost.findById(postId);
    if (!post) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Không tìm thấy bài viết",
        error: "Không tìm thấy bài viết",
        statusCode: 404,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }
    // Check if the user is the owner of the post
    if (post.poster.toString() !== user.id) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Không có quyền thực hiện",
        error: "Không có quyền thực hiện",
        statusCode: 403,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }
    // Update the post
    post.status = "finished";
    // post.updatedAt = new Date();

    await post.save();
    const dataResponse: SuccessResponse = {
      success: true,
      message: "Cập nhật bài viết tìm thú cưng thành công",
      data: post,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi cập nhật bài viết",
      error: "Xảy ra lỗi khi cập nhật bài viết: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleDeleteFindPetPostByIdService = async ({
  postId,
  user,
}: {
  postId: string;
  user: { id: string; username: string; email: string };
}) => {
  try {
    await connectMongoDB();
    // Find the post by ID
    const post = await LostPetPost.findById(postId);
    if (!post) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Không tìm thấy bài viết",
        error: "Không tìm thấy bài viết",
        statusCode: 404,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }
    // Check if the user is the owner of the post
    if (post.poster.toString() !== user.id) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Không có quyền thực hiện",
        error: "Không có quyền thực hiện",
        statusCode: 403,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }
    // Delete the post
    await LostPetPost.findByIdAndDelete(postId);
    // Remove the post reference from the user's findPetPosts array
    await User.updateOne({ _id: user.id }, { $pull: { findPetPosts: postId } });
    const dataResponse: SuccessResponse = {
      success: true,
      message: "Xóa bài viết tìm thú cưng thành công",
      data: "Xóa bài viết tìm thú cưng thành công",
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi xóa bài viết",
      error: "Xảy ra lỗi khi xóa bài viết: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleAddCommentService = async ({
  user,
  postId,
  content,
  files,
}: {
  user: { id: string; username: string; email: string };
  postId: string;
  content: string;
  files: Express.Multer.File[] | undefined;
}) => {
  try {
    await connectMongoDB();
    const [userInfo, postInfo] = await Promise.all([
      User.findById(user.id).select("-password"),
      LostPetPost.findById(postId),
    ]);
    if (!userInfo || !postInfo) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Không tìm thấy người dùng hoặc bài viết",
        error: "Không tìm thấy người dùng hoặc bài viết",
        statusCode: 404,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    } else {
      // Hàm uploadImage để tải ảnh lên Cloudinary và trả về URL
      let imageUrls: string[] = [];
      if (files) {
        imageUrls = await Promise.all(files.map((file) => uploadImage(file)));
      }
      // Tạo comment
      const newComment = await FindPetCommentModel.create({
        poster: userInfo._id,
        images: imageUrls,
        content: content,
        post: postInfo._id,
      });
      await newComment.populate("poster", "username profileImage");

      // Thêm comment này vào post
      postInfo.comments.push(newComment._id);
      await postInfo.save();

      // Pusher
      await pusherServer.trigger(
        `find-pet-post-${postId}-comments`,
        `new-comment`,
        newComment
      );
      // Nếu người cmt khác với người đăng bài thì tạo notification
      if (user.id !== postInfo.poster._id.toString()) {
        // Notification
        const notification = new Notification({
          receiver: postInfo.poster._id,
          status: "unseen",
          title: "Bình luận mới",
          subtitle: `${user.username} đã bình luận trong bài viết tìm thú cưng của bạn`,
          moreInfo: `/find-pet/${postId}`,
        });

        await notification.save();

        // Pusher: Send the notification
        await pusherServer.trigger(
          `user-${postInfo.poster._id.toString()}-notifications`,
          `new-notification`,
          notification
        );
      }
      /** Return */
      const dataResponse: SuccessResponse = {
        success: true,
        message: "Tạo bình luận thành công",
        data: newComment,
        statusCode: 200,
        type: SUCCESS,
      };
      return dataResponse;
    }
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi thêm bình luận",
      error: "Xảy ra lỗi khi thêm bình luận: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleGetCommentByPostService = async ({
  postId,
}: {
  postId: string;
}) => {
  try {
    await connectMongoDB();

    const comments = await FindPetCommentModel.find({ post: postId })
      .populate({
        path: "poster",
        model: User,
        select: "username email profileImage",
      })
      .sort({ createdAt: -1 })
      .exec();

    // Return the comments
    const dataResponse: SuccessResponse = {
      success: true,
      message: "Lấy danh sách bình luận thành công",
      data: comments,
      statusCode: 200,
      type: SUCCESS,
    };

    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi lấy danh sách bình luận",
      error: "Xảy ra lỗi khi lấy danh sách bình luận: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};
