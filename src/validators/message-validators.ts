import { body } from "express-validator";

export const createMessageValidator = [
  body("chatId").notEmpty().withMessage("Chat Id is required"),
];
