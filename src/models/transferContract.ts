import mongoose, { Model } from "mongoose";
import { IPetAdoptionPostDocument } from "./petAdoptionPost";
import { IAdoptionRequestDocument } from "./adoptionRequest";
import { IUserDocument } from "./user";

export interface ITransferContractDocument extends mongoose.Document {
  petAdoptionPost: IPetAdoptionPostDocument;
  adoptionRequest: IAdoptionRequestDocument;
  giver: IUserDocument;
  receiver: IUserDocument;
  giverConfirmed: boolean;
  receiverConfirmed: boolean;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

const transferContractSchema = new mongoose.Schema<ITransferContractDocument>(
  {
    petAdoptionPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PetAdoptionPost",
      required: true,
    },
    adoptionRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdoptionRequest",
      required: true,
    },
    giver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    giverConfirmed: {
      type: Boolean,
      default: false,
    },
    receiverConfirmed: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const TransferContract: Model<ITransferContractDocument> =
  mongoose.models?.TransferContract ||
  mongoose.model<ITransferContractDocument>(
    "TransferContract",
    transferContractSchema
  );

export default TransferContract;
