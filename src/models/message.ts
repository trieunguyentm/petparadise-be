import mongoose, { Model, Schema } from "mongoose";
import { IChatDocument } from "./chat";
import { IUserDocument } from "./user";

export interface IMessageDocument extends mongoose.Document {
  chat: IChatDocument;
  sender: IUserDocument;
  text: string;
  photo: string;
  createdAt: Date;
  seenBy: IUserDocument[];
}

const messageSchema = new Schema<IMessageDocument>({
  chat: { type: Schema.Types.ObjectId, ref: "Chat", required: true },
  sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, default: "" },
  photo: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now, index: true },
  seenBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
});

messageSchema.index({ createdAt: -1 });

const Message: Model<IMessageDocument> =
  mongoose.models?.Message ||
  mongoose.model<IMessageDocument>("Message", messageSchema);

export default Message;
