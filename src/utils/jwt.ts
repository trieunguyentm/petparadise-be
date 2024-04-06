import { v4 } from "uuid";
import { ACCCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import dotenv from "dotenv";
import jwt, { JwtPayload } from "jsonwebtoken";

dotenv.config();

export const generateRefreshToken = ({
  username,
  email,
  id,
}: {
  username?: string;
  email?: string;
  id: string;
}) => {
  /** Payload */
  const refreshTokenPayload = {
    id,
    username,
    email,
    tokenType: REFRESH_TOKEN,
  };
  /** Id cho Refresh Token */
  const jti = v4();
  /** Tạo refresh token */
  const refreshToken = jwt.sign(
    refreshTokenPayload,
    process.env.JWT_REFRESH_KEY as string,
    {
      expiresIn: process.env.JWT_REFRESH_TIME,
      jwtid: jti,
    }
  );
  /** Return refreshToken with id */
  return {
    value: refreshToken,
    jti: jti,
  };
};

export const generateAccessToken = ({
  username,
  email,
  id,
  refreshTokenId,
}: {
  username?: string;
  email?: string;
  id: string;
  refreshTokenId: string;
}) => {
  /** Payload */
  const accessTokenPayload = {
    id,
    username,
    email,
    tokenType: ACCCESS_TOKEN,
    refreshTokenId,
  };
  /** Id cho Access Token */
  const jti = v4();
  /** Tạo access token */
  const accessToken = jwt.sign(
    accessTokenPayload,
    process.env.JWT_ACCESS_KEY as string,
    {
      expiresIn: process.env.JWT_ACCESS_TIME,
      jwtid: jti,
    }
  );
  /** Return accessToken with id */
  return {
    value: accessToken,
    jti: jti,
  };
};

export const generateToken = ({
  username,
  email,
  id,
}: {
  username?: string;
  email?: string;
  id: string;
}) => {
  const refreshToken = generateRefreshToken({ username, email, id });
  const accessToken = generateAccessToken({
    username,
    email,
    id,
    refreshTokenId: refreshToken.jti,
  });
  return {
    refreshToken,
    accessToken,
  };
};

export const getExpiryDurationToken = (token: string): number => {
  try {
    const decoded = jwt.decode(token) as JwtPayload;
    if (!decoded || !decoded.exp) {
      return 0;
    } else {
      const now = Math.floor(Date.now() / 1000); // Chuyển về dạng giây
      // Thời gian còn sống của token
      const duration = decoded.exp - now;
      return duration;
    }
  } catch (error) {
    return 0;
  }
};
