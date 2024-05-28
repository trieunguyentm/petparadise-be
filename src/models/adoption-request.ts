import mongoose, { Model, Schema } from "mongoose";
import { IUserDocument } from "./user";
import { IPetAdoptionPostDocument } from "./pet-adoption-post";

export interface IAdoptionRequestDocument extends mongoose.Document {
  requester: IUserDocument;
  petAdoptionPost: IPetAdoptionPostDocument;
  descriptionForPet?: string; // Mô tả về thú cưng, dành cho type = "reclaim-pet"
  descriptionForUser?: string; // Mô tả về bản thân, dành cho type = "adopt-pet"
  contactInfo: string;
  type: "reclaim-pet" | "adopt-pet";
  status: "pending" | "approved" | "rejected";
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const adoptionRequestSchema = new Schema<IAdoptionRequestDocument>(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    petAdoptionPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PetAdoptionPost",
      required: true,
      index: true,
    },
    descriptionForPet: { type: String },
    descriptionForUser: { type: String },
    contactInfo: { type: String, default: "" },
    type: { type: String, required: true, enum: ["reclaim-pet", "adopt-pet"] },
    status: {
      type: String,
      required: true,
      enum: ["pending", "approved", "rejected"],
    },
    images: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

adoptionRequestSchema.index({ createdAt: -1 });

adoptionRequestSchema.index({ requester: 1, createdAt: -1 });

adoptionRequestSchema.index({ petAdoptionPost: 1, createdAt: -1 });

const AdoptionRequest: Model<IAdoptionRequestDocument> =
  mongoose.models?.AdoptionRequest ||
  mongoose.model<IAdoptionRequestDocument>(
    "AdoptionRequest",
    adoptionRequestSchema
  );

export default AdoptionRequest;
