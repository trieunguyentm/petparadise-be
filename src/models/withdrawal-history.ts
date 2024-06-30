import mongoose, { Schema, Document, Model } from "mongoose";
import { IUserDocument } from "./user";

export interface IWithdrawalHistory extends mongoose.Document {
  user: IUserDocument;
  amount: number;
  status: "pending" | "completed" | "failed";
  bankCode: string;
  accountNumber: string;
  accountName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const withdrawalHistorySchema = new mongoose.Schema<IWithdrawalHistory>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    bankCode: { type: String, required: true },
    accountNumber: { type: String, required: true },
    accountName: { type: String, default: "" },
  },
  { timestamps: true }
);

withdrawalHistorySchema.index({ user: 1 });

withdrawalHistorySchema.index({ createdAt: -1 });

const WithdrawalHistory: Model<IWithdrawalHistory> =
  mongoose.models?.WithdrawalHistory ||
  mongoose.model("WithdrawalHistory", withdrawalHistorySchema);

export default WithdrawalHistory;
