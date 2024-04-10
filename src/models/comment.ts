import mongoose, { Model, Schema } from "mongoose";

export interface ICommentDocument extends mongoose.Document {
  poster: Schema.Types.ObjectId;
  createdAt: Date;
  likes: Schema.Types.ObjectId[];
  post: Schema.Types.ObjectId;
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

const Comment: Model<ICommentDocument> =
  mongoose.models?.Comment ||
  mongoose.model<ICommentDocument>("Comment", commentSchema);

export default Comment;
