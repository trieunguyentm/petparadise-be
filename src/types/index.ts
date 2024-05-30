import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";

export type ErrorResponse = {
  success: false;
  message: string;
  error: string;
  statusCode: number;
  type: string;
};

export type SuccessResponse = {
  success: true;
  message: string;
  data?: any;
  statusCode: number;
  type: string;
};

export interface UserPayLoad extends JwtPayload {
  username: string;
  email: string;
  id: string;
}

export interface RequestCustom extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

export type TypePet =
  | "dog"
  | "cat"
  | "bird"
  | "rabbit"
  | "fish"
  | "rodents"
  | "reptile"
  | "other";

export type GenderPet = "male" | "female";

export type SizePet = "small" | "medium" | "big";

export type StatusPetAdoption = "available" | "adopted";

export type ReasonFindOwner = "lost-pet" | "your-pet";

export type ProductType =
  | "food"
  | "toys"
  | "medicine"
  | "accessories"
  | "housing"
  | "training"
  | "other";
