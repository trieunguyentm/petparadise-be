import { CheckoutRequestType, WebhookDataType } from "@payos/node/lib/type";
import { ErrorResponse, RequestCustom, SuccessResponse } from "../types";
import { ERROR_CLIENT, ERROR_SERVER, SUCCESS } from "../constants";
import dotenv from "dotenv";
import PayOS from "@payos/node";
import Product, { IProductDocument } from "../models/product";
import Order from "../models/order";
import { connectMongoDB } from "../db/mongodb";
import Notification from "../models/notification";
import { pusherServer } from "../utils/pusher";
import { generateOrderNotificationMail } from "../utils/mailgenerate";
import User from "../models/user";
import { sendEmail } from "../utils/mailer";

dotenv.config();

const payos = new PayOS(
  process.env.PAYOS_CLIENT_ID as string,
  process.env.PAYOS_API_KEY as string,
  process.env.PAYOS_CHECKSUM_KEY as string
);

export const handleCreatePaymentLinkService = async ({
  user,
  sellerId,
  products,
  buyerNote,
  checkoutData,
}: {
  user: { id: string; username: string; email: string };
  sellerId: string;
  products: { product: IProductDocument; quantity: number }[];
  buyerNote: string | undefined;
  checkoutData: CheckoutRequestType;
}) => {
  try {
    /** Kiểm tra số lượng sản phẩm */
    for (let i = 0; i < products.length; i++) {
      if (products[i].quantity > products[i].product.stock) {
        const dataResponse: ErrorResponse = {
          success: false,
          message: `Sản phẩm ${products[i].product.name} chỉ còn ${products[i].product.stock} sản phẩm.`,
          error: `Sản phẩm ${products[i].product.name} chỉ còn ${products[i].product.stock} sản phẩm.`,
          statusCode: 404,
          type: ERROR_CLIENT,
        };
        return dataResponse;
      }
    }
    await connectMongoDB();
    /** Kiểm tra người bán */
    const seller = await User.findById(sellerId);
    if (!seller) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Người bán không tồn tại",
        error: "Người bán không tồn tại",
        statusCode: 404,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }
    /** Tạo Link thanh toán */
    const paymentLink = await payos.createPaymentLink(checkoutData);

    const newOrder = new Order({
      orderCode: checkoutData.orderCode,
      buyer: user.id, // Id người mua
      seller: sellerId, // Id người bán
      products: products, // Danh sách {sản phẩm, số lượng}
      totalAmount: checkoutData.amount, // Tổng tiền
      description: checkoutData.description, // Mô tả
      buyerName: checkoutData.buyerName, // Tên người mua
      buyerEmail: checkoutData.buyerEmail, // Email người mua
      buyerPhone: checkoutData.buyerPhone, // Sđt người mua
      buyerAddress: checkoutData.buyerAddress, // Địa chỉ người mua
      buyerNote: buyerNote, // Note của người mua
      typePayment: "online",
      status: "pending", // Tình trạng đơn hàng
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await newOrder.save();

    const dataResponse: SuccessResponse = {
      success: true,
      message: "Tạo link thanh toán thành công",
      data: paymentLink.checkoutUrl,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi tạo link thanh toán",
      error: "Xảy ra lỗi khi tạo link thanh toán: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};

export const handleVerifyPaymentWebhook = async (req: RequestCustom) => {
  const webhookData = payos.verifyPaymentWebhookData(req.body);
  return webhookData;
};

export const handleDirectPaymentService = async ({
  user,
  sellerId,
  products,
  buyerNote,
  checkoutData,
}: {
  user: { id: string; username: string; email: string };
  sellerId: string;
  products: { product: IProductDocument; quantity: number }[];
  buyerNote: string | undefined;
  checkoutData: CheckoutRequestType;
}) => {
  try {
    /** Kiểm tra số lượng sản phẩm */
    for (let i = 0; i < products.length; i++) {
      if (products[i].quantity > products[i].product.stock) {
        const dataResponse: ErrorResponse = {
          success: false,
          message: `Sản phẩm ${products[i].product.name} chỉ còn ${products[i].product.stock} sản phẩm.`,
          error: `Sản phẩm ${products[i].product.name} chỉ còn ${products[i].product.stock} sản phẩm.`,
          statusCode: 404,
          type: ERROR_CLIENT,
        };
        return dataResponse;
      }
    }
    /** Tạo đơn hàng */
    await connectMongoDB();
    /** Kiểm tra người bán */
    const seller = await User.findById(sellerId);
    if (!seller) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Người bán không tồn tại",
        error: "Người bán không tồn tại",
        statusCode: 404,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }

    const newOrder = new Order({
      orderCode: checkoutData.orderCode,
      buyer: user.id, // Id người mua
      seller: sellerId, // Id người bán
      products: products, // Danh sách {sản phẩm, số lượng}
      totalAmount: checkoutData.amount, // Tổng tiền
      description: checkoutData.description, // Mô tả
      buyerName: checkoutData.buyerName, // Tên người mua
      buyerEmail: checkoutData.buyerEmail, // Email người mua
      buyerPhone: checkoutData.buyerPhone, // Sđt người mua
      buyerAddress: checkoutData.buyerAddress, // Địa chỉ người mua
      buyerNote: buyerNote, // Note của người mua
      typePayment: "offline",
      status: "offline", // Tình trạng đơn hàng
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await newOrder.save();

    const populatedOrder = await Order.findById(newOrder._id)
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
        select: "name price stock",
      })
      .exec();

    if (!populatedOrder) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Đơn hàng không tồn tại",
        error: "Đơn hàng không tồn tại",
        statusCode: 404,
        type: ERROR_CLIENT,
      };
      return dataResponse;
    }

    /** Gửi thông báo cho người mua */
    const buyerNotification = {
      receiver: user.id.toString(),
      status: "unseen",
      title: "Đơn hàng đã được đặt thành công",
      subtitle: `Đơn hàng #${populatedOrder.orderCode} đã được đặt thành công.`,
      content: `Đơn hàng của bạn đã được đặt thành công và hiện đang được chuẩn bị để vận chuyển.`,
      moreInfo: `/store/purchased-order`,
    };

    /** Gửi thông báo cho người bán */
    const sellerNotification = {
      receiver: sellerId,
      status: "unseen",
      title: "Đơn hàng mới",
      subtitle: `Bạn đã nhận được đơn đặt hàng mới #${populatedOrder.orderCode}.`,
      content: `Một đơn đặt hàng mới đã được đặt. Vui lòng kiểm tra chi tiết.`,
      moreInfo: `/store/manage-order`,
    };

    /** Lưu notification */
    const [savedBuyerNotification, savedSellerNotification] =
      await Notification.insertMany([buyerNotification, sellerNotification]);

    /** Gửi thông báo thời gian thực cho người mua */
    await pusherServer.trigger(
      `user-${user.id}-notifications`,
      "new-notification",
      savedBuyerNotification
    );

    /** Gửi thông báo thời gian thực cho người bán */
    await pusherServer.trigger(
      `user-${sellerId}-notifications`,
      "new-notification",
      savedSellerNotification
    );

    /** Gửi email cho người bán */
    const emailBody = generateOrderNotificationMail(
      seller.username,
      populatedOrder.orderCode,
      user.username,
      populatedOrder.products.map((product) => ({
        name: product.product.name,
        quantity: product.quantity,
        price: product.product.price,
      })),
      populatedOrder.totalAmount
    );
    const subject = "Thông báo đơn hàng mới";
    await sendEmail(seller.email, subject, emailBody);

    const dataResponse: SuccessResponse = {
      success: true,
      message: "Tạo đơn hàng thành công",
      data: populatedOrder,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Xảy ra lỗi khi tạo đơn hàng",
      error: "Xảy ra lỗi khi tạo đơn hàng: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};
