import { CheckoutRequestType, WebhookDataType } from "@payos/node/lib/type";
import { ErrorResponse, RequestCustom, SuccessResponse } from "../types";
import { ERROR_SERVER, SUCCESS } from "../constants";
import dotenv from "dotenv";
import PayOS from "@payos/node";
import { IProductDocument } from "../models/product";
import Order from "../models/order";
import { connectMongoDB } from "../db/mongodb";

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
  products: { product: IProductDocument[]; quantity: number }[];
  buyerNote: string | undefined;
  checkoutData: CheckoutRequestType;
}) => {
  try {
    /** Tạo Link thanh toán */
    const paymentLink = await payos.createPaymentLink(checkoutData);

    /** Tạo đơn hàng */
    await connectMongoDB();
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
      status: "pending", // Tình trạng đơn hàng
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await newOrder.save();

    const dataResponse: SuccessResponse = {
      success: true,
      message: "Get pet adoption post successfully",
      data: paymentLink.checkoutUrl,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Failed to create payment link",
      error: "Failed to create payment link: " + error.message,
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
