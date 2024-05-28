import mongoose, { Model, Schema } from "mongoose";
import { IProductDocument } from "./product";
import { IUserDocument } from "./user";

export interface IReviewDocument extends Document {
  user: IUserDocument;
  product: IProductDocument;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReviewDocument>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

// Indexes for optimizing search and filtering
reviewSchema.index({ product: 1 }); // Index for searching by product
reviewSchema.index({ user: 1 }); // Index for searching by user
reviewSchema.index({ createdAt: 1 }); // Index for sorting by creation date

const Review: Model<IReviewDocument> =
  mongoose.models?.Review ||
  mongoose.model<IReviewDocument>("Review", reviewSchema);

export default Review;
