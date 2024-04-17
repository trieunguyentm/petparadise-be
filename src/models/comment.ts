import mongoose, { Model, Schema } from "mongoose";
import { IUserDocument } from "./user";
import { IPostDocument } from "./post";

export interface ICommentDocument extends mongoose.Document {
  poster: IUserDocument;
  createdAt: Date;
  likes: IUserDocument[];
  post: IPostDocument;
  content: string;
  image: string;
}

const commentSchema = new Schema<ICommentDocument>({
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
    ref: "Post",
    required: true,
    index: true,
  },
  content: { type: String, required: true },
  image: { type: String, default: "" },
});

// Thêm composite index để tối ưu hóa việc query comment theo post và sắp xếp theo thời gian từ mới nhất đến cũ hơn
commentSchema.index({ post: 1, createdAt: -1 });

const CommentModel: Model<ICommentDocument> =
  mongoose.models?.Comment ||
  mongoose.model<ICommentDocument>("Comment", commentSchema);

export default CommentModel;
