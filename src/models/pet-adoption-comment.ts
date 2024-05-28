import mongoose, { Model, Schema } from "mongoose";
import { IUserDocument } from "./user";
import { IPetAdoptionPostDocument } from "./pet-adoption-post";

export interface IPetAdoptionCommentDocument extends mongoose.Document {
  poster: IUserDocument;
  createdAt: Date;
  likes: IUserDocument[];
  post: IPetAdoptionPostDocument;
  content: string;
  images: string[];
}

const petAdoptionCommentSchema = new Schema<IPetAdoptionCommentDocument>(
  {
    poster: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    createdAt: { type: Date, default: Date.now, index: true },
    likes: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
    post: {
      type: Schema.Types.ObjectId,
      ref: "PetAdoptionPost",
      required: true,
      index: true,
    },
    content: { type: String, required: true },
    images: [{ type: String, default: "" }],
  },
  {
    timestamps: true,
  }
);

// Thêm composite index để tối ưu hóa việc query comment theo post và sắp xếp theo thời gian từ mới nhất đến cũ hơn
petAdoptionCommentSchema.index({ post: 1, createdAt: -1 });

const PetAdoptionCommentModel: Model<IPetAdoptionCommentDocument> =
  mongoose.models?.PetAdoptionComment ||
  mongoose.model<IPetAdoptionCommentDocument>(
    "PetAdoptionComment",
    petAdoptionCommentSchema
  );

export default PetAdoptionCommentModel;
