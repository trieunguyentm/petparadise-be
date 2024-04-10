import { NextFunction, Response } from "express";
import { ErrorResponse, RequestCustom, UserPayLoad } from "../types";
import { SESSION_EXPIRED } from "../constants";
import { connectRedis } from "../db/redis";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import multer from "multer";

dotenv.config();

// Cấu hình middleware authenticate
export const authenticate = async (
  req: RequestCustom,
  res: Response,
  next: NextFunction
) => {
  try {
    const tokenId = req.cookies["t"];
    if (!tokenId) {
      let response: ErrorResponse = {
        success: false,
        message: "Not provided a token id",
        error: "Not found token id",
        statusCode: 403,
        type: SESSION_EXPIRED,
      };
      res.status(403).json(response);
      return;
    }
    const client = await connectRedis();
    const token = await client.get(tokenId);
    if (!token) {
      let response: ErrorResponse = {
        success: false,
        message: "Not found token",
        error: "Not exist token in DB",
        statusCode: 403,
        type: SESSION_EXPIRED,
      };
      res.status(403).json(response);
      return;
    }
    const payload = jwt.verify(token, process.env.JWT_KEY as string);
    if (payload) {
      req.user = payload as UserPayLoad;
      next();
    } else {
      let response: ErrorResponse = {
        success: false,
        message: "Error when verify authenticate",
        error: "Error when verify authenticate",
        statusCode: 403,
        type: SESSION_EXPIRED,
      };
      res.status(403).json(response);
      return;
    }
  } catch (error) {
    let response: ErrorResponse = {
      success: false,
      message: "Error when verify authenticate",
      error: "Error when verify authenticate",
      statusCode: 403,
      type: SESSION_EXPIRED,
    };
    res.status(403).json(response);
    return;
  }
};

// Cấu hình multer
const storage = multer.memoryStorage();

export const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Kiểm tra file có phải là ảnh
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|svg)$/)) {
      return cb(null, false);
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn file size <= 5MB
});
