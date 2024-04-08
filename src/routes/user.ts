import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import * as userControllers from "../controllers/user-controllers";
import * as validators from "../validators/user-validators";
import { NextFunction, Response, Router } from "express";
import { ErrorResponse, RequestCustom, UserPayLoad } from "../types";
import { SESSION_EXPIRED } from "../constants";
import { connectRedis } from "../db/redis";

dotenv.config();
const userRoute = Router();

const authenticate = async (
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

userRoute.use(authenticate);

userRoute.get("/", userControllers.handleGetUser);

userRoute.post(
  "/change-password",
  validators.changePasswordValidator,
  userControllers.handleChangePassword
);

export default userRoute;
