import mongoose, { Model } from "mongoose";
import { IPostDocument } from "./post";
import { ILostPetPostDocument } from "./lost-pet-post";
import { IPetAdoptionPostDocument } from "./pet-adoption-post";
import { TypePet } from "../types";
import { IProductDocument } from "./product";
import { IWithdrawalHistory } from "./withdrawal-history";
import { IChatDocument } from "./chat";

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
  chats: IChatDocument[];
  cart: ICartItem[];
  favoriteProducts: IProductDocument[];
  role: "user" | "admin";
  accountBalance: number;
  withdrawalHistory: IWithdrawalHistory[];
  isBanned: boolean;
  banExpiration?: Date;
  updatedAt: Date;
  createdAt: Date;
}

const userSchema = new mongoose.Schema<IUserDocument>(
  {
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
    favoriteProducts: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: [] },
    ],
    role: { type: String, enum: ["user", "admin"], default: "user" },
    accountBalance: { type: Number, default: 0 },
    withdrawalHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "WithdrawalHistory",
        default: [],
      },
    ],
    isBanned: { type: Boolean, default: false },
    banExpiration: { type: Date },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Thêm chỉ mục cho trường username để tối ưu cho việc truy vấn
userSchema.index({ username: 1 });

// Thêm chỉ mục cho trường createdAt để tối ưu cho việc sắp xếp theo ngày tạo
userSchema.index({ createdAt: -1 });

// Thêm chỉ mục cho giỏ hàng để tối ưu hóa tìm kiếm và cập nhật
userSchema.index({ "cart.product": 1 });

// Thêm chỉ mục cho danh sách sản phẩm yêu thích
userSchema.index({ favoriteProducts: 1 });

const User: Model<IUserDocument> =
  mongoose.models?.User || mongoose.model("User", userSchema);

export default User;
