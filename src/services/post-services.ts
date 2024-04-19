import cloudinary from "../utils/cloudinary-config";
import Post from "../models/post";
import { Stream } from "stream";
import { ERROR_CLIENT, ERROR_SERVER, SUCCESS } from "../constants";
import { ErrorResponse, SuccessResponse } from "../types";
import { connectMongoDB } from "../db/mongodb";
import User from "../models/user";
import Comment from "../models/comment";
import { normalizeQuery } from "../utils/normalize";
import CommentModel from "../models/comment";
import { pusherServer } from "../utils/pusher";

const uploadImage = async (file: Express.Multer.File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Tạo một stream upload từ Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "user_posts" },
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

export const handleCreatePostService = async ({
  user,
  files,
  content,
  tags,
}: {
  user: { id: string; username: string; email: string };
  files: Express.Multer.File[];
  content: string;
  tags: string;
}) => {
  try {
    // Hàm uploadImage để tải ảnh lên Cloudinary và trả về URL
    const imageUrls = await Promise.all(files.map((file) => uploadImage(file)));

    await connectMongoDB();
    // Tạo bài đăng mới với thông tin được cung cấp và URL ảnh
    const newPost = await Post.create({
      poster: user.id,
      images: imageUrls,
      content: content,
      tags: tags ? tags.split(",") : [], // Chuyển chuỗi tags thành mảng
      // Các trường khác như likes, saves, comments sẽ mặc định hoặc trống
    });

    const userInfo = await User.findById(user.id);
    userInfo?.posts.push(newPost);
    await userInfo?.save();

    const dataResponse: SuccessResponse = {
      success: true,
      message: "Post created successfully",
      data: newPost,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Failed to create post",
      error: "Failed to create post",
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleGetPostService = async ({
  limit,
  offset,
}: {
  limit: number;
  offset: number;
}) => {
  try {
    await connectMongoDB();
    const posts = await Post.find()
      .skip(offset)
      .limit(limit)
      .sort({ createdAt: -1 }) // Sắp xếp theo thời gian tạo, mới nhất đầu tiên
      .populate({
        path: "poster likes saves",
        model: User,
        select: "-password",
      })
      .populate({
        path: "comments",
        model: Comment,
        options: { sort: { createdAt: -1 } },
        populate: {
          path: "poster",
          model: User,
          select: "-password",
        },
      })
      .exec();
    const dataResponse: SuccessResponse = {
      success: true,
      message: "Get post successfully",
      data: posts,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Failed to create post",
      error: "Failed to create post: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleSearchPostService = async ({ query }: { query: string }) => {
  try {
    await connectMongoDB();
    const newQuery = normalizeQuery(query);
    const regexPattern = new RegExp(newQuery, "i");

    const searchedPosts = await Post.find({
      $or: [
        { content: { $regex: regexPattern } },
        { tags: { $elemMatch: { $regex: regexPattern } } },
      ],
    })
      .populate({
        path: "poster likes saves",
        model: User,
      })
      .populate({
        path: "comments",
        model: Comment,
      })
      .exec();

    const dataResponse: SuccessResponse = {
      success: true,
      message: "Get post successfully",
      data: searchedPosts,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Failed to get post",
      error: "Failed to get post: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleGetDetailPostService = async ({
  postId,
}: {
  postId: string;
}) => {
  try {
    await connectMongoDB();
    const post = await Post.findById(postId)
      .populate({
        path: "poster likes saves",
        model: User,
      })
      .populate({
        path: "comments",
        model: Comment,
        options: { sort: { createdAt: -1 } },
        populate: {
          path: "poster",
          model: User,
          select: "-password",
        },
      })
      .exec();
    if (!post) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Not found post",
        error: "Not found post with id: " + postId,
        statusCode: 404,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    } else {
      const dataResponse: SuccessResponse = {
        success: true,
        message: "Get post successfully",
        data: post,
        statusCode: 200,
        type: SUCCESS,
      };
      return dataResponse;
    }
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Failed to get post",
      error: "Failed to get post: " + error.message,
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
  file,
}: {
  user: { id: string; username: string; email: string };
  postId: string;
  content: string;
  file: Express.Multer.File | undefined;
}) => {
  try {
    await connectMongoDB();
    const [userInfo, postInfo] = await Promise.all([
      User.findById(user.id).select("-password"),
      Post.findById(postId),
    ]);
    if (!userInfo || !postInfo) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Not found user or post",
        error: "Not found user or post",
        statusCode: 404,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    } else {
      /** Đăng ảnh */
      let imageURL: string = "";
      if (file) {
        imageURL = await uploadImage(file);
      }
      /** Tạo comment mới */
      const newComment = await CommentModel.create({
        poster: userInfo._id,
        image: imageURL,
        content: content,
        post: postInfo._id,
      });
      await newComment.populate("poster", "username profileImage"); // Populate only needed fields

      /** Thêm comment này vào post */
      postInfo.comments.push(newComment._id);
      await postInfo.save();

      /** Prepare the data for Pusher - only include necessary fields */
      const commentDataForPusher = {
        _id: newComment._id,
        poster: {
          _id: userInfo._id,
          username: userInfo.username,
          profileImage: userInfo.profileImage,
        },
        content: newComment.content,
        image: newComment.image,
        createdAt: newComment.createdAt,
      };

      /** Pusher */
      await pusherServer.trigger(
        `post-${postId}-comments`,
        `new-comment`,
        commentDataForPusher
      );
      /** Return */
      const dataResponse: SuccessResponse = {
        success: true,
        message: "Add comment successfully",
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
      message: "Failed when add comment",
      error: "Failed when add comment: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};
