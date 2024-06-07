import mongoose, { Model, Schema } from "mongoose";
import { IProductDocument } from "./product";
import { IUserDocument } from "./user";

export interface IOrderDocument extends mongoose.Document {
  orderCode: number;
  buyer: IUserDocument;
  seller: IUserDocument;
  products: {
    product: IProductDocument;
    quantity: number;
  }[];
  totalAmount: number;
  description: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  buyerAddress?: string;
  buyerNote?: string;
  status:
    | "pending"
    | "processed"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "success";
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrderDocument>(
  {
    orderCode: {
      type: Number,
      required: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    description: { type: String, default: "" },
    buyerName: { type: String, default: "" },
    buyerEmail: { type: String, default: "" },
    buyerPhone: { type: String, default: "" },
    buyerAddress: { type: String, default: "" },
    buyerNote: { type: String, default: "" },
    status: {
      type: String,
      enum: [
        "pending",
        "processed",
        "shipped",
        "delivered",
        "cancelled",
        "success",
      ],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for optimizing search and filtering
orderSchema.index({ buyer: 1 }); // Index for searching by buyer
orderSchema.index({ seller: 1 }); // Index for searching by seller
orderSchema.index({ status: 1 }); // Index for searching by status
orderSchema.index({ createdAt: 1 }); // Index for searching by creation date
orderSchema.index({ updatedAt: 1 }); // Index for searching by update date

const Order: Model<IOrderDocument> =
  mongoose.models?.Order ||
  mongoose.model<IOrderDocument>("Order", orderSchema);

export default Order;
