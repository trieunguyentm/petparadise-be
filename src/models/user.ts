import mongoose, { Model } from "mongoose";

export interface IUserDocument extends mongoose.Document {
  username: string;
  email: string;
  password: string;
  profileImage?: string;
  posts: mongoose.Schema.Types.ObjectId[];
  savedPosts: mongoose.Schema.Types.ObjectId[];
  likedPosts: mongoose.Schema.Types.ObjectId[];
  followers: mongoose.Schema.Types.ObjectId[];
  following: mongoose.Schema.Types.ObjectId[];
  chats: mongoose.Schema.Types.ObjectId[];
  role: "user" | "admin";
  createdAt: Date;
}

const userSchema = new mongoose.Schema<IUserDocument>({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profileImage: { type: String, default: "" },
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

const User: Model<IUserDocument> =
  mongoose.models?.User || mongoose.model("User", userSchema);

export default User;
