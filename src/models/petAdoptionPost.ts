import mongoose, { Model, Schema } from "mongoose";
import { IUserDocument } from "./user";

export interface IPetAdoptionPostDocument extends mongoose.Document {
  poster: IUserDocument; // Người đăng bài
  petName?: string; // Tên thú cưng
  petType:
    | "dog"
    | "cat"
    | "bird"
    | "rabbit"
    | "fish"
    | "rodents"
    | "reptile"
    | "other";
  sizePet?: "small" | "medium" | "big";
  gender?: "male" | "female";
  breed?: string; // Giống của thú cưng
  color?: string; // Màu lông
  healthInfo: string; // Thông tin sức khỏe thú cưng
  description: string; // Mô tả chi tiết thú cưng và lí do tìm chủ mới
  likes: IUserDocument[];
  comments: mongoose.Schema.Types.ObjectId[];
  location: string; // Vị trí hiện tại của thú cưng
  images: string[]; // Các hình ảnh của thú cưng
  contactInfo: string; // Thông tin liên lạc để liên hệ
  status: "available" | "adopted"; // Trạng thái của bài đăng
  reason: "lost-pet" | "your-pet"; // Lí do cần tìm chủ mới
  createdAt: Date; // Ngày tạo bài đăng
  updatedAt: Date; // Ngày cập nhật bài đăng
}

const petAdoptionPostSchema = new Schema<IPetAdoptionPostDocument>(
  {
    poster: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    petName: { type: String },
    petType: {
      type: String,
      required: true,
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
    },
    sizePet: {
      type: String,
      enum: ["small", "medium", "big"],
    },
    gender: {
      type: String,
      enum: ["male", "female"],
    },
    breed: { type: String },
    color: { type: String },
    healthInfo: { type: String, required: true },
    description: { type: String, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PetAdoptionComment",
        default: [],
      },
    ],
    location: { type: String, required: true },
    images: [{ type: String }],
    contactInfo: { type: String, required: true },
    status: {
      type: String,
      enum: ["available", "adopted"],
      default: "available",
    },
    reason: {
      type: String,
      enum: ["lost-pet", "your-pet"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

petAdoptionPostSchema.index({ createdAt: -1 });

petAdoptionPostSchema.index({ poster: 1, createdAt: -1 });

const PetAdoptionPost: Model<IPetAdoptionPostDocument> =
  mongoose.models?.PetAdoptionPost ||
  mongoose.model<IPetAdoptionPostDocument>(
    "PetAdoptionPost",
    petAdoptionPostSchema
  );

export default PetAdoptionPost;
