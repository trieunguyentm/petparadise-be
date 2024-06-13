import { body } from "express-validator";

export const createMessageValidator = [
  body("chatId").notEmpty().withMessage("ID cuộc trò chuyện không hợp lệ"),
];
