import Bull from "bull";
import { connectMongoDB } from "../db/mongodb";
import Product, { IProductDocument } from "../models/product";
import Order from "../models/order";
import { generateOrderSuccessMail } from "../utils/mailgenerate";
import { sendEmail } from "../utils/mailer";
import User from "../models/user";

// Kết nối Redis
const redisOptions = {
  redis: {
    host: process.env.HOST_REDIS as string,
    port: parseInt(process.env.PORT_REDIS as string, 10),
    password: process.env.PASSWORD_REDIS as string,
  },
};

const orderQueue = new Bull("orderQueue", redisOptions);

// Xử lý nhiệm vụ chuyển đổi trạng thái Order
orderQueue.process(async (job) => {
  const { type, data } = job.data;

  await connectMongoDB();

  switch (type) {
    case "UPDATE_STATUS":
      await handleUpdateStatusOrder(data);
      break;
    default:
      console.log(`Unknown job type: ${type}`);
  }
});

const handleUpdateStatusOrder = async (data: { orderId: string }) => {
  try {
    const order = await Order.findById(data.orderId)
      .populate({
        path: "buyer",
        model: User,
        select: "username email profileImage",
      })
      .populate({
        path: "products.product",
        model: Product,
      })
      .exec();

    if (!order) {
      console.log("Order not found");
      return;
    }

    const now = new Date();
    const lastUpdated = new Date(order.updatedAt);
    const timeDiff = now.getTime() - lastUpdated.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);

    if (order.status === "delivered" && daysDiff >= 7) {
      order.status = "success";
      await order.save();

      // Gửi email thông báo đơn hàng thành công
      const emailBody = generateOrderSuccessMail(
        order.buyer.username,
        order.orderCode,
        order.products.map((product) => ({
          name: product.product.name,
          quantity: product.quantity,
          price: product.product.price,
        }))
      );

      await sendEmail(order.buyer.email, "Order Success", emailBody);

      console.log(`Order ${order.orderCode} status updated to success.`);
    } else {
      console.log(`Order ${order.orderCode} not eligible for status update.`);
    }
  } catch (error) {
    console.error("Error processing order status job:", error);
  }
};

console.log("Order worker started.");

export default orderQueue;
