import mongoose, { Model, Schema } from "mongoose";
import { IUserDocument } from "./user";
import { IMessageDocument } from "./message";

export interface IChatDocument extends mongoose.Document {
  members: IUserDocument[];
  messages: IMessageDocument[];
  isGroup: Boolean;
  name: string;
  groupPhoto: string;
  createdAt: Date;
  lastMessageAt: Date;
}

const chatSchema = new Schema<IChatDocument>({
  members: [
    { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  ],
  messages: [{ type: Schema.Types.ObjectId, ref: "Message", default: [] }],
  isGroup: { type: Boolean, default: false },
  name: { type: String, default: "" },
  groupPhoto: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  lastMessageAt: { type: Date, default: Date.now, index: true },
});

// Tạo index composite để tối ưu hóa việc tìm kiếm các cuộc hội thoại mà người dùng là một phần và sắp xếp chúng theo thời gian của tin nhắn cuối cùng
chatSchema.index({ members: 1, lastMessageAt: -1 });

const Chat: Model<IChatDocument> =
  mongoose.models?.Chat || mongoose.model<IChatDocument>("Chat", chatSchema);

export default Chat;
