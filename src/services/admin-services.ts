import { ERROR_CLIENT, ERROR_SERVER, SUCCESS } from "../constants";
import { connectMongoDB } from "../db/mongodb";
import { connectRedis } from "../db/redis";
import Order from "../models/order";
import Post from "../models/post";
import Product from "../models/product";
import RefundRequest from "../models/refund-request";
import Report from "../models/report";
import User from "../models/user";
import WithdrawalHistory from "../models/withdrawal-history";
import { ErrorResponse, SuccessResponse } from "../types";
import { sendEmail } from "../utils/mailer";
import {
  generateBanNotificationMail,
  generateRefundSuccessMail,
  generateWithdrawalCompletedMail,
} from "../utils/mailgenerate";

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

export const handleDrawMoneyHistoriesService = async ({
  limit,
  offset,
}: {
  limit: number;
  offset: number;
}) => {
  try {
    await connectMongoDB();

    const drawMoneyHistories = await WithdrawalHistory.find()
      .skip(offset)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        model: User,
        select: "username email profileImage",
      })
      .exec();

    const dataResponse: SuccessResponse = {
      success: true,
      message: "Lấy thông tin thành công",
      data: drawMoneyHistories,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi lấy danh sách yêu cầu nhận tiền",
      error: "Xảy ra lỗi khi lấy danh sách yêu cầu nhận tiền: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleUpdateDrawMoneyHistoryService = async ({
  newStatus,
  drawMoneyHistoryId,
}: {
  newStatus: "pending" | "completed" | "failed";
  drawMoneyHistoryId: string;
}) => {
  try {
    await connectMongoDB();

    // Tìm yêu cầu nhận tiền
    const drawMoneyHistory = await WithdrawalHistory.findById(
      drawMoneyHistoryId
    )
      .populate({
        path: "user",
        model: User,
        select: "username email profileImage",
      })
      .exec();
    // Kiểm tra xem yêu cầu có tồn tại
    if (!drawMoneyHistory) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Yêu cầu nhận tiền này không tồn tại",
        error: "Yêu cầu nhận tiền này không tồn tại",
        statusCode: 404,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }
    // Nếu yêu cầu đã hoàn thành trước đó
    if (drawMoneyHistory.status === "completed") {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Yêu cầu nhận tiền này đã được xử lý",
        error: "Yêu cầu nhận tiền này đã được xử lý",
        statusCode: 400,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }
    // Lưu trạng thái mới
    drawMoneyHistory.status = newStatus;
    await drawMoneyHistory.save();
    // Nếu trạng thái mới là "completed", gửi email thông báo
    if (newStatus === "completed") {
      const emailBody = generateWithdrawalCompletedMail(
        drawMoneyHistory.user.username,
        drawMoneyHistory.amount
      );
      const subject = "Yêu cầu nhận tiền đã được xử lý thành công";
      await sendEmail(drawMoneyHistory.user.email, subject, emailBody);
    }
    // Return
    let dataResponse: SuccessResponse = {
      success: true,
      message: "Cập nhật trạng thái yêu cầu nhận tiền thành công",
      data: drawMoneyHistory,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi cập nhật trạng thái yêu cầu nhận tiền",
      error:
        "Xảy ra lỗi khi cập nhật trạng thái yêu cầu nhận tiền: " +
        error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleDeleteProductByAdminService = async ({
  productId,
}: {
  productId: string;
}) => {
  try {
    await connectMongoDB();

    // Tìm kiếm sản phẩm theo productId
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

    // Xóa sản phẩm
    await Product.findByIdAndDelete(productId);

    // Trả về phản hồi thành công
    let dataResponse: SuccessResponse = {
      success: true,
      message: "Xóa sản phẩm thành công",
      data: null,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi xóa sản phẩm",
      error: "Xảy ra lỗi khi xóa sản phẩm: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleGetRefundRequestService = async ({
  limit,
  offset,
}: {
  limit: number;
  offset: number;
}) => {
  try {
    await connectMongoDB();

    const refundRequests = await RefundRequest.find()
      .skip(offset)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate({
        path: "order",
        model: Order,
        populate: [
          {
            path: "products.product",
            model: Product,
          },
          {
            path: "buyer",
            model: User,
            select: "username email profileImage",
          },
          {
            path: "seller",
            model: User,
            select: "username email profileImage",
          },
        ],
      })
      .exec();

    const dataResponse: SuccessResponse = {
      success: true,
      message: "Lấy danh sách yêu cầu hoàn tiền thành công",
      data: refundRequests,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi lấy yêu cầu hoàn tiền",
      error: "Xảy ra lỗi khi lấy yêu cầu hoàn tiền: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleUpdateRefundRequestService = async ({
  newStatus,
  refundRequestId,
}: {
  newStatus: "pending" | "approved";
  refundRequestId: string;
}) => {
  try {
    await connectMongoDB();

    // Tìm yêu cầu hoàn tiền
    const refundRequest = await RefundRequest.findById(refundRequestId)
      .populate({
        path: "buyer",
        model: User,
        select: "username email profileImage",
      })
      .populate({
        path: "order",
        model: Order,
        select: "orderCode",
      })
      .exec();
    // Kiểm tra xem yêu cầu có tồn tại
    if (!refundRequest) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Yêu cầu hoàn tiền này không tồn tại",
        error: "Yêu cầu hoàn tiền này không tồn tại",
        statusCode: 404,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }
    // Nếu yêu cầu đã hoàn thành trước đó
    if (refundRequest.status === "approved") {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Yêu cầu hoàn tiền này đã được xử lý",
        error: "Yêu cầu hoàn tiền này đã được xử lý",
        statusCode: 400,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }
    // Kiểm tra trạng thái mới
    if (newStatus === refundRequest.status) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Cần cập nhật trạng thái khác",
        error: "Cần cập nhật trạng thái khác",
        statusCode: 400,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }
    // Lưu trạng thái mới
    refundRequest.status = newStatus;
    await refundRequest.save();
    // Gửi email thông báo
    if (newStatus === "approved") {
      const emailBody = generateRefundSuccessMail(
        refundRequest.buyer.username,
        refundRequest.amount,
        refundRequest.order.orderCode
      );
      const subject = `Yêu cầu hoàn tiền cho đơn hàng ${refundRequest.order.orderCode} đã thành công`;
      await sendEmail(refundRequest.buyer.email, subject, emailBody);
    }
    // Return
    let dataResponse: SuccessResponse = {
      success: true,
      message: "Cập nhật trạng thái yêu cầu hoàn tiền thành công",
      data: refundRequest,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi cập nhật trạng thái yêu cầu hoàn tiền",
      error:
        "Xảy ra lỗi khi cập nhật trạng thái yêu cầu hoàn tiền: " +
        error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};
