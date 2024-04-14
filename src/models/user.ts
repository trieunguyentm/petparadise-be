import mongoose, { Model } from "mongoose";
import { IPostDocument } from "./post";

export interface IUserDocument extends mongoose.Document {
  username: string;
  email: string;
  password: string;
  profileImage?: string;
  address?: string;
  dateOfBirth?: Date;
  posts: IPostDocument[];
  savedPosts: IPostDocument[];
  likedPosts: IPostDocument[];
  followers: IUserDocument[];
  following: IUserDocument[];
  chats: mongoose.Schema.Types.ObjectId[];
  role: "user" | "admin";
  createdAt: Date;
}

const userSchema = new mongoose.Schema<IUserDocument>({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profileImage: { type: String, default: "" },
  address: { type: String, default: "" },
  dateOfBirth: { type: Date },
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post", default: [] }],
  savedPosts: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Post", default: [] },
  ],
  likedPosts: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Post", default: [] },
  ],
  followers: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] },
  ],
  following: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] },
  ],
  chats: [{ type: mongoose.Schema.Types.ObjectId, ref: "Chat", default: [] }],
  role: { type: String, enum: ["user", "admin"], default: "user" },
  createdAt: { type: Date, default: Date.now },
});

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Thêm chỉ mục cho trường username để tối ưu cho việc truy vấn
userSchema.index({ username: 1 });

// Cần sắp xếp theo ngày tạo nên thêm chỉ mục cho trường createdAt
userSchema.index({ createdAt: -1 });

const User: Model<IUserDocument> =
  mongoose.models?.User || mongoose.model("User", userSchema);

export default User;
