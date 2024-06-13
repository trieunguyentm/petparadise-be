import { Response } from "express";
import { ErrorResponse, RequestCustom } from "../types";
import { validationResult } from "express-validator";
import { ERROR_CLIENT } from "../constants";
import { CheckoutRequestType, WebhookDataType } from "@payos/node/lib/type";
import {
  handleCreatePaymentLinkService,
  handleVerifyPaymentWebhook,
} from "../services/payment-services";
import Product, { IProductDocument } from "../models/product";
import { connectMongoDB } from "../db/mongodb";
import Order from "../models/order";
import notificationQueue from "../workers/notification-queue";
import User from "../models/user";

export const handleCreatePaymentLink = async (
  req: RequestCustom,
  res: Response
) => {
  // Kiểm tra kết quả validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response: ErrorResponse = {
      success: false,
      message: `Thông tin không hợp lệ: ${errors.array()[0].msg}`,
      error: errors.array()[0].msg,
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(response);
  }
  // Kiểm tra người dùng
  const { user } = req;
  if (!user) {
    const response: ErrorResponse = {
      success: false,
      message: "Chưa cung cấp người dùng",
      error: "Chưa cung cấp người dùng",
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(response);
  }
  /** Lấy các thông tin như sellerId, products, buyerNote, checkoutData để tạo Payment Link */
  const sellerId = req.body.sellerId as string;
  const products = req.body.listItem.products as {
    product: IProductDocument[];
    quantity: number;
  }[];
  const buyerNote = req.body.buyerNote as string | undefined;
  const checkoutData = req.body.checkoutData as CheckoutRequestType;
  // Tạo link
  const result = await handleCreatePaymentLinkService({
    user,
    sellerId,
    products,
    buyerNote,
    checkoutData,
  });

  // Check the result and respond accordingly
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(200).json(result);
  }
};

export const handleReceiveHook = async (req: RequestCustom, res: Response) => {
  try {
    /** Kiểm tra webhookData */
    const webhookData = await handleVerifyPaymentWebhook(req);
    /** Nếu không có lỗi, lất ra code, desc và orderCode */
    const { code, desc, orderCode } = webhookData;
    if (code === "00" && desc === "success") {
      try {
        /** Lấy ra order */
        await connectMongoDB();

        const order = await Order.findOne({ orderCode })
          .populate({
            path: "seller",
            model: User,
            select: "username email profileImage",
          })
          .populate({
            path: "buyer",
            model: User,
            select: "username email profileImage",
          })
          .populate({
            path: "products.product",
            model: Product,
            select: "name price",
          })
          .exec();

        if (!order) {
          return res.json();
        }

        /** Cập nhật order */
        order.status = "processed";
        await order.save();
        /** Thêm nhiệm vụ gửi thông báo vào hàng đợi */
        await notificationQueue.add({
          type: "ORDER_PROCESSED",
          data: {
            buyer: order.buyer,
            seller: order.seller,
            order,
          },
        });
        /** Return */
        return res.status(200).json({ message: "Đơn hàng đã được cập nhập" });
      } catch (error: any) {
        console.log("Error when update order:", error.message);
        return res.json();
      }
    } else {
      return res.json();
    }
  } catch (error: any) {
    console.log("Error Receive Hook:", error.message);
    return res.json();
  }
};
