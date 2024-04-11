import mongoose, { Model } from "mongoose";
import { IUserDocument } from "./user";

export interface IPostDocument extends mongoose.Document {
  poster: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
  likes: IUserDocument[];
  saves: mongoose.Schema.Types.ObjectId[];
  comments: mongoose.Schema.Types.ObjectId[];
  images: string[];
  content: string;
  tags: string[];
}

const postSchema = new mongoose.Schema<IPostDocument>({
  poster: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  createdAt: { type: Date, default: Date.now, index: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
  saves: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
  comments: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: [] },
  ],
  images: [{ type: String }],
  content: { type: String, required: true },
  tags: [{ type: String, index: true }],
});

// Index for sorting posts by createdAt and supporting efficient query lookups
// This helps in fetching the latest posts efficiently
postSchema.index({ createdAt: -1 });

// Optional: Composite index if you plan to sort or filter by poster and createdAt
// This is helpful if you show posts for a specific user sorted by their creation time
postSchema.index({ poster: 1, createdAt: -1 });

const Post: Model<IPostDocument> =
  mongoose.models?.Post || mongoose.model<IPostDocument>("Post", postSchema);

export default Post;
