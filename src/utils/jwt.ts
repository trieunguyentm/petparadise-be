import { v4 } from "uuid";
import dotenv from "dotenv";
import jwt, { JwtPayload } from "jsonwebtoken";

dotenv.config();

export const generateToken = ({
  username,
  email,
  id,
}: {
  username?: string;
  email?: string;
  id?: string;
}) => {
  // Payload
  const tokenPayload = {
    id,
    username,
    email,
  };
  // Id cho token
  const jti = v4();
  // Tạo token
  const token = jwt.sign(tokenPayload, process.env.JWT_KEY as string, {
    expiresIn: process.env.JWT_TIME,
    jwtid: jti,
  });
  // Return
  return {
    value: token,
    jti: jti,
  };
};

export const getExpiryDurationToken = (token: string): number => {
  try {
    const decoded = jwt.decode(token) as JwtPayload;
    if (!decoded || !decoded.exp) {
      return 0;
    } else {
      // Chuyển về dạng giây
      const now = Math.floor(Date.now() / 1000);
      // Thời gian còn sống của token
      const duration = decoded.exp - now;
      return duration;
    }
  } catch (error) {
    return 0;
  }
};
