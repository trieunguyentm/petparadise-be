import mongoose, { Model } from "mongoose";
import { IUserDocument } from "./user";

export interface INotificationDocument extends mongoose.Document {
  receiver: IUserDocument;
  status: "seen" | "unseen";
  title: string;
  subtitle: string;
  content?: string;
  moreInfo?: string;
}

const notificationSchema = new mongoose.Schema<INotificationDocument>(
  {
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["unseen", "seen"],
      default: "unseen",
    },
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      required: true,
    },
    content: {
      type: String,
    },
    moreInfo: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ createdAt: -1 });

notificationSchema.index({ receiver: 1, createdAt: -1 });

const Notification: Model<INotificationDocument> =
  mongoose.models?.Notification ||
  mongoose.model<INotificationDocument>("Notification", notificationSchema);

export default Notification;
