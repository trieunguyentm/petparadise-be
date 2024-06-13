import { ERROR_CLIENT, ERROR_SERVER, SUCCESS } from "../constants";
import { connectMongoDB } from "../db/mongodb";
import Order from "../models/order";
import RefundRequest from "../models/refund-request";
import User from "../models/user";
import { ErrorResponse, SuccessResponse } from "../types";

export const handleCreateRefundRequestService = async ({
  user,
  orderId,
  bankCode,
  bankName,
  bankNumber,
}: {
  user: { id: string; username: string; email: string };
  orderId: string;
  bankCode: string;
  bankName?: string;
  bankNumber: string;
}) => {
  try {
    await connectMongoDB();
    // TÌm order
    const order = await Order.findById(orderId)
      .populate({
        path: "buyer seller",
        model: User,
        select: "username email profileImage",
      })
      .exec();
    // Nếu không tìm thấy Order
    if (!order) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Không tìm thấy đơn hàng",
        error: "Không tìm thấy đơn hàng",
        statusCode: 404,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }
    // Check if the requester is the buyer of the order
    if (order.buyer._id.toString() !== user.id) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Không thể thực hiện",
        error: "Không thể thực hiện",
        statusCode: 403,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }
    // Check if the order status is cancelled
    if (order.status !== "cancelled") {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Chỉ khi đơn hàng bị từ chối mới có thể được hoàn tiền",
        error: "Chỉ khi đơn hàng bị từ chối mới có thể được hoàn tiền",
        statusCode: 403,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }
    // Check if there is an existing refund request for the order
    const existingRefundRequest = await RefundRequest.findOne({
      order: order._id,
    }).exec();
    if (existingRefundRequest) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Bạn đã tạo yêu cầu hoàn tiền trước đó rồi",
        error: "Bạn đã tạo yêu cầu hoàn tiền trước đó rồi",
        statusCode: 400,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }
    // Check if the refund amount is less than the total amount
    const remainingRefundAmount = order.totalAmount - (order.refund || 0);
    if (remainingRefundAmount <= 0) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Đơn hàng này đã được hoàn tiền",
        error: "Đơn hàng này đã được hoàn tiền",
        statusCode: 400,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }
    // Create the refund request
    const refundRequest = new RefundRequest({
      order: order._id,
      buyer: order.buyer._id,
      bankCode: bankCode,
      accountNumber: bankNumber,
      accountName: bankName,
      amount: remainingRefundAmount,
      status: "pending",
    });

    await refundRequest.save();

    let dataResponse: SuccessResponse = {
      success: true,
      message: "Tạo yêu cầu hoàn tiền thành công",
      data: refundRequest,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi tạo yêu cầu nhận thú cưng",
      error: "Xảy ra lỗi khi tạo yêu cầu nhận thú cưng: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleGetRefundRequestByOrderService = async ({
  user,
  orderId,
}: {
  user: { username: string; email: string; id: string };
  orderId: string;
}) => {
  try {
    await connectMongoDB();

    // Tìm Order
    const order = await Order.findById(orderId)
      .populate({
        path: "buyer seller",
        model: User,
        select: "username email profileImage",
      })
      .exec();

    // Nếu không tìm thấy Order
    if (!order) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Không tìm thấy đơn hàng",
        error: "Không tìm thấy đơn hàng",
        statusCode: 404,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }

    // Check if the requester is the buyer of the order
    if (order.buyer._id.toString() !== user.id) {
      let dataResponse: ErrorResponse = {
        success: false,
        message:
          "Không thể thực hiện",
        error: "Không thể thực hiện",
        statusCode: 403,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }

    // Tìm yêu cầu hoàn tiền dựa trên orderId
    const refundRequest = await RefundRequest.findOne({
      order: order._id,
    }).exec();

    // Return success response with refund request data
    let dataResponse: SuccessResponse = {
      success: true,
      message: "Lấy yêu cầu hoàn tiền thành công",
      data: refundRequest,
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
