import mongoose, { Model } from "mongoose";
import { IPostDocument } from "./post";
import { ILostPetPostDocument } from "./lost-pet-post";
import { IPetAdoptionPostDocument } from "./pet-adoption-post";
import { TypePet } from "../types";
import { IProductDocument } from "./product";

export interface ICartItem {
  product: IProductDocument;
  quantity: number;
}

export interface IUserDocument extends mongoose.Document {
  username: string;
  email: string;
  password: string;
  profileImage?: string;
  address?: string;
  petTypeFavorites?: TypePet[];
  dateOfBirth?: Date;
  posts: IPostDocument[];
  findPetPosts: ILostPetPostDocument[];
  petAdoptionPosts: IPetAdoptionPostDocument[];
  savedPosts: IPostDocument[];
  likedPosts: IPostDocument[];
  followers: IUserDocument[];
  following: IUserDocument[];
  chats: mongoose.Schema.Types.ObjectId[];
  cart: ICartItem[];
  role: "user" | "admin";
  createdAt: Date;
}

const userSchema = new mongoose.Schema<IUserDocument>({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profileImage: { type: String, default: "" },
  address: { type: String, default: "" },
  petTypeFavorites: [
    {
      type: String,
      enum: [
        "dog",
        "cat",
        "bird",
        "rabbit",
        "fish",
        "rodents",
        "reptile",
        "other",
      ],
      default: [],
    },
  ],
  dateOfBirth: { type: Date },
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post", default: [] }],
  findPetPosts: [
    { type: mongoose.Schema.Types.ObjectId, ref: "LostPetPost", default: [] },
  ],
  petAdoptionPosts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PetAdoptionPost",
      default: [],
    },
  ],
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
  cart: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantity: { type: Number, default: 1 },
    },
  ],
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
