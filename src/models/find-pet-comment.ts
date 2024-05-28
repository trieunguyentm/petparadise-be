import mongoose, { Model, Schema } from "mongoose";
import { IUserDocument } from "./user";
import { ILostPetPostDocument } from "./lost-pet-post";

export interface IFindPetCommentDocument extends mongoose.Document {
  poster: IUserDocument;
  createdAt: Date;
  likes: IUserDocument[];
  post: ILostPetPostDocument;
  content: string;
  images: string[];
}

const findPetCommentSchema = new Schema<IFindPetCommentDocument>(
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
      ref: "LostPetPost",
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
findPetCommentSchema.index({ post: 1, createdAt: -1 });

const FindPetCommentModel: Model<IFindPetCommentDocument> =
  mongoose.models?.FindPetComment ||
  mongoose.model<IFindPetCommentDocument>(
    "FindPetComment",
    findPetCommentSchema
  );

export default FindPetCommentModel;
