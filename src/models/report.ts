import mongoose, { Model, Schema } from "mongoose";
import { IUserDocument } from "./user";
import { IPostDocument } from "./post";

export interface IReportDocument extends mongoose.Document {
  reporter: IUserDocument;
  description: string;
  link: string;
  status: "pending" | "reviewing" | "resolved";
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReportDocument>(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    description: { type: String, required: true },
    link: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ["pending", "reviewing", "resolved"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for optimizing search and filtering
reportSchema.index({ reporter: 1 });
reportSchema.index({ createdAt: 1 });

const Report: Model<IReportDocument> =
  mongoose.models?.Report ||
  mongoose.model<IReportDocument>("Report", reportSchema);

export default Report;
