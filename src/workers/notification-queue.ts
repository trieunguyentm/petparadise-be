import Bull from "bull";
import User, { IUserDocument } from "../models/user";
import Notification from "../models/notification";
import { TypePet } from "../types";
import { IPetAdoptionPostDocument } from "../models/pet-adoption-post";
import { ILostPetPostDocument } from "../models/lost-pet-post";
import { pusherServer } from "../utils/pusher";
import { connectMongoDB } from "../db/mongodb";
import { IOrderDocument } from "../models/order";
import { sendEmail } from "../utils/mailer";
import { generateOrderNotificationMail } from "../utils/mailgenerate";

// Kết nối Redis
const redisOptions = {
  redis: {
    host: process.env.HOST_REDIS as string,
    port: parseInt(process.env.PORT_REDIS as string, 10),
    password: process.env.PASSWORD_REDIS as string,
  },
};

const notificationQueue = new Bull("notificationQueue", redisOptions);

// Xử lý nhiệm vụ gửi thông báo
notificationQueue.process(async (job) => {
  const { type, data } = job.data;

  await connectMongoDB();

  switch (type) {
    case "PET_ADOPTION":
      await handlePetAdoptionNotification(data);
      break;
    case "FIND_PET":
      await handleFindPetNotification(data);
      break;
    case "ORDER_PROCESSED":
      await handleOrderProcessedNotification(data);
      break;
    default:
      console.log(`Unknown job type: ${type}`);
  }
});

const handlePetAdoptionNotification = async (data: {
  location: string;
  typePet: TypePet;
  user: { id: string; username: string; email: string };
  newPetAdoptionPost: IPetAdoptionPostDocument;
}) => {
  try {
    await connectMongoDB();
    const { location, typePet, user, newPetAdoptionPost } = data;
    const cityName = location.split("-")[0];
    const relatedUsers = await User.find({
      _id: { $ne: user.id },
      address: { $regex: new RegExp(`^${cityName}`) },
      petTypeFavorites: { $in: [typePet] },
    });

    const notifications = relatedUsers.map((relatedUser) => ({
      receiver: relatedUser._id,
      status: "unseen",
      title: "Bài đăng nhận nuôi thú cưng mới",
      subtitle: `Một bài đăng nhận nuôi thú cưng mới đã được tạo trong khu vực của bạn.`,
      content: `Một bài đăng nhận nuôi thú cưng mới đã được tạo trong khu vực của bạn.`,
      moreInfo: `/pet-adoption/${newPetAdoptionPost._id}`,
    }));

    const savedNotifications = await Notification.insertMany(notifications);

    savedNotifications.forEach(async (notification) => {
      await pusherServer.trigger(
        `user-${notification.receiver.toString()}-notifications`,
        "new-notification",
        notification
      );
    });
  } catch (error: any) {
    console.error("Error in handlePetAdoptionNotification:", error);
  }
};

const handleFindPetNotification = async (data: {
  location: string;
  typePet: TypePet;
  user: { id: string; username: string; email: string };
  newFindPetPost: ILostPetPostDocument;
}) => {
  try {
    await connectMongoDB();
    const { location, typePet, user, newFindPetPost } = data;
    const cityName = location.split("-")[0];
    const relatedUsers = await User.find({
      _id: { $ne: user.id },
      address: { $regex: new RegExp(`^${cityName}`) },
      petTypeFavorites: { $in: [typePet] },
    });

    const notifications = relatedUsers.map((relatedUser) => ({
      receiver: relatedUser._id,
      status: "unseen",
      title: "Bài đăng tìm kiếm thú cưng mới",
      subtitle: `Một bài đăng về thú cưng bị thất lạc mới đã được tạo trong khu vực của bạn.`,
      content: `Một bài đăng về thú cưng bị thất lạc mới đã được tạo trong khu vực của bạn.`,
      moreInfo: `/find-pet/${newFindPetPost._id}`,
    }));

    const savedNotifications = await Notification.insertMany(notifications);

    savedNotifications.forEach(async (notification) => {
      await pusherServer.trigger(
        `user-${notification.receiver.toString()}-notifications`,
        "new-notification",
        notification
      );
    });
  } catch (error) {
    console.error("Error in handleFindPetNotification:", error);
  }
};

const handleOrderProcessedNotification = async (data: {
  buyer: IUserDocument;
  seller: IUserDocument;
  order: IOrderDocument;
}) => {
  try {
    await connectMongoDB();
    const { buyer, seller, order } = data;
    /** Gửi thông báo cho người mua */
    const buyerNotification = {
      receiver: buyer._id.toString(),
      status: "unseen",
      title: "Đơn hàng đã được thanh toán",
      subtitle: `Đơn hàng #${order.orderCode} đã được thanh toán.`,
      content: `Đơn hàng của bạn đã được xử lý thành công và hiện đang được chuẩn bị để vận chuyển.`,
      moreInfo: `/store/purchased-order`,
    };

    /** Gửi thông báo cho người bán */
    const sellerNotification = {
      receiver: seller._id.toString(),
      status: "unseen",
      title: "Đơn hàng mới",
      subtitle: `Bạn đã nhận được đơn đặt hàng mới #${order.orderCode}.`,
      content: `Một đơn đặt hàng mới đã được đặt. Vui lòng kiểm tra chi tiết và chuẩn bị hàng hóa để vận chuyển.`,
      moreInfo: `/store/manage-order`,
    };

    /** Lưu notification */
    const [savedBuyerNotification, savedSellerNotification] =
      await Notification.insertMany([buyerNotification, sellerNotification]);

    /** Gửi thông báo thời gian thực cho người mua */
    await pusherServer.trigger(
      `user-${buyer._id.toString()}-notifications`,
      "new-notification",
      savedBuyerNotification
    );

    /** Gửi thông báo thời gian thực cho người bán */
    await pusherServer.trigger(
      `user-${seller._id.toString()}-notifications`,
      "new-notification",
      savedSellerNotification
    );
    /** Gửi email cho người bán */
    const emailBody = generateOrderNotificationMail(
      seller.username,
      order.orderCode,
      buyer.username,
      order.products.map((product) => ({
        name: product.product.name,
        quantity: product.quantity,
        price: product.product.price,
      })),
      order.totalAmount
    );

    const subject = "Thông báo đơn hàng mới";
    await sendEmail(seller.email, subject, emailBody);
  } catch (error: any) {
    console.error("Error in handleOrderProcessedNotification:", error);
  }
};

console.log("Notification worker started.");

export default notificationQueue;
