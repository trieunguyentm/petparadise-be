import { Response } from "express";
import { RequestCustom } from "../types";

export const handleGetUser = (req: RequestCustom, res: Response) => {
  const { user } = req;
  return res.status(200).json(user);
};
