import mongoose, { Model } from "mongoose";
import { IUserDocument } from "./user";
import { ICommentDocument } from "./comment";

export interface ILostPetPostDocument extends mongoose.Document {
  poster: IUserDocument;
  // createdAt: Date;
  // updatedAt: Date;
  petName?: string;
  petType:
    | "dog"
    | "cat"
    | "bird"
    | "rabbit"
    | "fish"
    | "rodents"
    | "reptile"
    | "other";
  gender?: "male" | "female";
  breed?: string;
  color?: string;
  lastSeenLocation: string;
  lastSeenDate: Date;
  contactInfo: string;
  description: string;
  likes: IUserDocument[];
  comments: ICommentDocument[];
  images: string[];
  size: "small" | "medium" | "big";
  tags: string[];
  status: "unfinished" | "finished";
}

const lostPetPostSchema = new mongoose.Schema<ILostPetPostDocument>(
  {
    poster: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // createdAt: { type: Date, default: Date.now, index: true },
    // updatedAt: { type: Date, default: Date.now, index: true },
    petName: { type: String },
    petType: {
      type: String,
      required: true,
      enum: [
        "dog",
        "cat",
        "bird",
        "rabbit",
        "fish",
        "rodents",
        "reptile",
        "other",
      ],
    },
    gender: {
      type: String,
      enum: ["male", "female"],
    },
    breed: { type: String },
    color: { type: String },
    lastSeenLocation: { type: String, required: true },
    lastSeenDate: { type: Date },
    contactInfo: { type: String, required: true },
    description: { type: String, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
    comments: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: [] },
    ],
    images: [{ type: String }],
    size: { type: String, enum: ["small", "medium", "big"] },
    tags: [{ type: String, index: true }],
    status: { type: String, enum: ["unfinished", "finished"] },
  },
  {
    timestamps: true,
  }
);

// Index for sorting posts by createdAt and supporting efficient query lookups
// This helps in fetching the latest posts efficiently
lostPetPostSchema.index({ createdAt: -1 });

// Composite index if you plan to sort or filter by poster and createdAt
// This is helpful if you show posts for a specific user sorted by their creation time
lostPetPostSchema.index({ poster: 1, createdAt: -1 });

const LostPetPost: Model<ILostPetPostDocument> =
  mongoose.models?.LostPetPost ||
  mongoose.model<ILostPetPostDocument>("LostPetPost", lostPetPostSchema);

export default LostPetPost;
