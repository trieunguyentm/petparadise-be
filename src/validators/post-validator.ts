import { body } from "express-validator";

export const createPostValidator = [
  body("content").notEmpty().withMessage("Content is required"),
];
