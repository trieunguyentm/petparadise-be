import mongoose, { Model, Schema } from "mongoose";
import { IUserDocument } from "./user";

export interface IProductDocument extends mongoose.Document {
  seller: IUserDocument;
  name: string;
  normalizedName: string; // Tên sản phẩm đã chuẩn hóa
  description: string;
  price: number;
  discountRate?: number; // Tỷ lệ giảm giá (%)
  discountedPrice?: number; // Giá sau khi giảm
  discountStartDate?: Date; // Ngày bắt đầu giảm giá
  discountEndDate?: Date; // Ngày kết thúc giảm giá
  images: string[];
  productType:
    | "food"
    | "toys"
    | "medicine"
    | "accessories"
    | "housing"
    | "training"
    | "service"
    | "other";
  stock: number; // Số lượng sản phẩm
  createdAt: Date;
  updatedAt: Date;
}

const normalizeString = (str: string) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

const productSchema = new Schema<IProductDocument>(
  {
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    normalizedName: { type: String }, // Lưu tên đã chuẩn hóa
    description: { type: String, required: true },
    price: { type: Number, required: true },
    discountRate: { type: Number, default: 0 },
    discountedPrice: { type: Number },
    discountStartDate: { type: Date },
    discountEndDate: { type: Date },
    images: [{ type: String }],
    productType: {
      type: String,
      required: true,
      enum: [
        "food",
        "toys",
        "medicine",
        "accessories",
        "housing",
        "training",
        "service",
        "other",
      ],
    },
    stock: { type: Number, required: true, default: 0 },
  },
  {
    timestamps: true,
  }
);

productSchema.pre("save", function (next) {
  if (this.discountRate != null && this.discountRate > 0) {
    this.discountedPrice = this.price - this.price * (this.discountRate / 100);
  } else {
    this.discountedPrice = undefined;
  }
  next();
});

// Indexes for optimizing search and sorting
productSchema.index({ createdAt: -1 }); // Index for sorting by newest products
productSchema.index({ productType: 1 }); // Index for searching by productType
productSchema.index({ seller: 1 }); // Index for searching by seller
productSchema.index({ name: 1 }); // Index for full-text search on name
productSchema.index({ price: 1 }); // Index for sorting by price

// Middleware để chuẩn hóa tên sản phẩm trước khi lưu
productSchema.pre("save", function (next) {
  this.normalizedName = normalizeString(this.name);
  next();
});

const Product: Model<IProductDocument> =
  mongoose.models?.Product ||
  mongoose.model<IProductDocument>("Product", productSchema);

export default Product;
