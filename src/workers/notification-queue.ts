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
      title: "New Pet Adoption Post",
      subtitle: `A new ${typePet} adoption post has been created in your area.`,
      content: `Check out the new adoption post by ${user.username}.`,
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
      title: "New Lost Pet Post",
      subtitle: `A new lost pet post has been created in your area.`,
      content: `Check out the new lost pet post by ${user.username}.`,
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
      title: "Order Processed",
      subtitle: `Your order #${order.orderCode} has been processed.`,
      content: `Your order has been successfully processed and is now being prepared for shipment.`,
      moreInfo: `/store/purchased-order`,
    };

    /** Gửi thông báo cho người bán */
    const sellerNotification = {
      receiver: seller._id.toString(),
      status: "unseen",
      title: "New Order",
      subtitle: `You have received a new order #${order.orderCode}.`,
      content: `A new order has been placed. Please check the details and prepare the items for shipment.`,
      moreInfo: `/store/order`,
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

    const subject = "New Order Notification";
    await sendEmail(seller.email, subject, emailBody);
  } catch (error: any) {
    console.error("Error in handleOrderProcessedNotification:", error);
  }
};

console.log("Notification worker started.");

export default notificationQueue;
