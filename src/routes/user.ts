// import jwt from "jsonwebtoken";
// import dotenv from "dotenv";
// import { NextFunction, Request, Response, Router } from "express";
// import { ErrorResponse } from "../types/response";
// import { SESSION_EXPIRED } from "../constants";
// import { connectRedis } from "../db/redis";
// import { generateAccessToken, getExpiryDurationToken } from "../utils/jwt";

// export interface RequestCustom extends Request {
//   user?: {
//     id: string;
//     username: string;
//     email: string;
//   };
// }

// export interface AccessTokenPayload {
//   id: string;
//   username: string;
//   email: string;
//   tokenType?: string;
//   refreshTokenId?: string;
// }

// export interface RefreshTokenPayload {
//   id: string;
//   username: string;
//   email: string;
//   tokenType?: string;
// }

// dotenv.config();
// const userRoute = Router();

// const authenticationToken = async (
//   req: RequestCustom,
//   res: Response,
//   next: NextFunction
// ) => {
//   const accessToken = req.cookies["access-token"];
//   const refreshTokenId = req.cookies["refresh-token-id"];
//   if (!accessToken) {
//     return await refreshAccessToken(req, res, next, refreshTokenId);
//   }
//   try {
//     const payload = jwt.verify(
//       accessToken,
//       process.env.JWT_ACCESS_KEY as string
//     ) as AccessTokenPayload;
//     delete payload.tokenType;
//     delete payload.refreshTokenId;
//     req.user = payload;
//     next();
//   } catch (error) {
//     return await refreshAccessToken(req, res, next, refreshTokenId);
//   }
// };

// const refreshAccessToken = async (
//   req: RequestCustom,
//   res: Response,
//   next: NextFunction,
//   refreshTokenId: string
// ) => {
//   if (!refreshTokenId) {
//     const response: ErrorResponse = {
//       success: false,
//       message: `Session expired, please login again`,
//       error: "Session expired",
//       statusCode: 403,
//       type: SESSION_EXPIRED,
//     };
//     res.status(403).json(response);
//   }
//   try {
//     const client = await connectRedis();
//     const refreshToken = await client.get(refreshTokenId);
//     if (!refreshToken) {
//       const response: ErrorResponse = {
//         success: false,
//         message: `Session expired, please login again`,
//         error: "Session expired",
//         statusCode: 403,
//         type: SESSION_EXPIRED,
//       };
//       res.status(403).json(response);
//     } else {
//       const payload = jwt.verify(
//         refreshToken,
//         process.env.JWT_REFRESH_KEY as string
//       ) as RefreshTokenPayload;
//       const newAccessToken = generateAccessToken({
//         username: payload.username,
//         email: payload.email,
//         id: payload.id,
//         refreshTokenId,
//       });
//       res.cookie("access-token", newAccessToken.value, {
//         maxAge: getExpiryDurationToken(newAccessToken.value) * 1000,
//         httpOnly: true,
//         secure: false,
//       });
//       delete payload.tokenType;
//       req.user = payload;
//       next();
//     }
//   } catch (error) {
//     const response: ErrorResponse = {
//       success: false,
//       message: `Session expired, please login again`,
//       error: "Session expired",
//       statusCode: 403,
//       type: SESSION_EXPIRED,
//     };
//     res.status(403).json(response);
//   }
// };

// userRoute.use(authenticationToken);

// userRoute.get("/test", (req, res) => res.send("Ok"));

// export default userRoute;
