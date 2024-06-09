import mongoose, { Model, Schema } from "mongoose";
import { IOrderDocument } from "./order";
import { IUserDocument } from "./user";

export interface IRefundRequestDocument extends mongoose.Document {
  order: IOrderDocument;
  buyer: IUserDocument;
  bankCode: string;
  accountNumber: string;
  accountName?: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

const refundRequestSchema = new Schema<IRefundRequestDocument>(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bankCode: { type: String, required: true },
    accountNumber: { type: String, required: true },
    accountName: { type: String, default: "" },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

refundRequestSchema.index({ createdAt: -1 });
refundRequestSchema.index({ updatedAt: 1 });
refundRequestSchema.index({ buyer: 1 });
refundRequestSchema.index({ status: 1 });

const RefundRequest: Model<IRefundRequestDocument> =
  mongoose.models?.RefundRequest ||
  mongoose.model<IRefundRequestDocument>("RefundRequest", refundRequestSchema);

export default RefundRequest;
