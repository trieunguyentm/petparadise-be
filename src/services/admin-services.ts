import { ERROR_CLIENT, ERROR_SERVER, SUCCESS } from "../constants";
import { connectMongoDB } from "../db/mongodb";
import { connectRedis } from "../db/redis";
import Post from "../models/post";
import Report from "../models/report";
import User from "../models/user";
import { ErrorResponse, SuccessResponse } from "../types";
import { sendEmail } from "../utils/mailer";
import { generateBanNotificationMail } from "../utils/mailgenerate";

export const handleBanUserService = async ({
  user,
  userId,
  timeBan,
}: {
  user: { email: string; id: string; username: string };
  userId: string;
  timeBan: number;
}) => {
  try {
    await connectMongoDB();

    // Tìm người dùng với userId đã cung cấp
    const userToBan = await User.findById(userId);

    if (!userToBan) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Người dùng không tồn tại",
        error: "Người dùng không tồn tại",
        statusCode: 404,
        type: "ERROR_CLIENT",
      };
      return dataResponse;
    }

    // Cập nhật trạng thái tài khoản và thời gian hết hạn khóa
    userToBan.isBanned = true;
    userToBan.banExpiration = new Date(Date.now() + timeBan * 60 * 60 * 1000); // timeBan tính bằng giờ

    await userToBan.save();

    // Xóa các phiên đăng nhập
    const client = await connectRedis();
    // Lấy tất cả các tokenId của người dùng
    const tokenIds = await client.sMembers(`${userId}`);
    // Xóa tất cả các tokenId trong Redis
    const deletePromises: any = tokenIds.map((tokenId) => client.del(tokenId));
    await Promise.all(deletePromises);
    // Xóa SET chứa danh sách tokenId của người dùng
    await client.del(`${userId}`);

    // Gửi email
    // Tạo nội dung email thông báo tài khoản bị khóa
    const emailBody = generateBanNotificationMail(userToBan.email, timeBan);
    const subject = "Thông báo tài khoản bị khóa";

    // Gửi email thông báo
    await sendEmail(userToBan.email, subject, emailBody);

    let dataResponse: SuccessResponse = {
      success: true,
      message: "Khóa tài khoản người dùng thành công",
      data: userToBan,
      statusCode: 200,
      type: "SUCCESS",
    };
    return dataResponse;
  } catch (error: any) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi khóa tài khoản người dùng",
      error: "Xảy ra lỗi khi khóa tài khoản người dùng: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleDeletePostService = async ({
  user,
  postId,
}: {
  user: { username: string; id: string; email: string };
  postId: string;
}) => {
  try {
    await connectMongoDB();

    // Tìm bài viết dựa trên postId
    const post = await Post.findById(postId).populate("poster");

    // Kiểm tra xem bài viết có tồn tại không
    if (!post) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Bài viết không tồn tại",
        error: "Bài viết không tồn tại",
        statusCode: 404,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }

    // Xóa bài viết
    await Post.findByIdAndDelete(postId);

    // Xóa postId khỏi mảng posts của người đăng bài (poster)
    const poster = await User.findById(post.poster._id);
    if (poster) {
      poster.posts = poster.posts.filter((id) => id.toString() !== postId);
      await poster.save();
    }

    let dataResponse: SuccessResponse = {
      success: true,
      message: "Xóa bài viết thành công",
      data: "Xóa bài viết thành công",
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

export const handleGetReportService = async ({
  limit,
  offset,
}: {
  limit: number;
  offset: number;
}) => {
  try {
    await connectMongoDB();

    const reports = await Report.find()
      .skip(offset)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate({
        path: "reporter",
        model: User,
        select: "username email profileImage",
      })
      .exec();

    const dataResponse: SuccessResponse = {
      success: true,
      message: "Lấy thông tin báo cáo thành công",
      data: reports,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi lấy báo cáo",
      error: "Xảy ra lỗi khi lấy báo cáo: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleUpdateReportService = async ({
  newStatus,
  reportId,
}: {
  newStatus: "pending" | "reviewing" | "resolved";
  reportId: string;
}) => {
  try {
    await connectMongoDB();

    // Tìm báo cáo dựa trên reportId
    const report = await Report.findById(reportId)
      .populate({
        path: "reporter",
        model: Report,
        select: "username email profileImage",
      })
      .exec();

    // Kiểm tra xem báo cáo có tồn tại hay không
    if (!report) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Báo cáo này không tồn tại",
        error: "Báo cáo này không tồn tại",
        statusCode: 404,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }

    if (newStatus === report.status) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Trạng thái mới phải khác trạng thái ban đầu",
        error: "Trạng thái mới phải khác trạng thái ban đầu",
        statusCode: 400,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }

    report.status = newStatus;
    await report.save();

    let dataResponse: SuccessResponse = {
      success: true,
      message: "Cập nhật trạng thái báo cáo thành công",
      data: report,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi cập nhật báo cáo",
      error: "Xảy ra lỗi khi cập nhật báo cáo: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};
