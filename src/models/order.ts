import mongoose, { Model, Schema } from "mongoose";
import { IProductDocument } from "./product";
import { IUserDocument } from "./user";

export interface IOrderDocument extends Document {
  buyer: IUserDocument;
  seller: IUserDocument;
  products: {
    product: IProductDocument;
    quantity: number;
  }[];
  totalAmount: number;
  status: "pending" | "processed" | "shipped" | "delivered" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrderDocument>(
  {
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
    status: {
      type: String,
      enum: ["pending", "processed", "shipped", "delivered", "cancelled"],
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
