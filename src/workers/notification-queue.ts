import Bull from "bull";
import User from "../models/user";
import Notification from "../models/notification";
import { TypePet } from "../types";
import { IPetAdoptionPostDocument } from "../models/pet-adoption-post";
import { ILostPetPostDocument } from "../models/lost-pet-post";
import { pusherServer } from "../utils/pusher";
import { connectMongoDB } from "../db/mongodb";

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
};

const handleFindPetNotification = async (data: {
  location: string;
  typePet: TypePet;
  user: { id: string; username: string; email: string };
  newFindPetPost: ILostPetPostDocument;
}) => {
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
};

console.log("Notification worker started.");

export default notificationQueue;
