import { body, query } from "express-validator";

export const createPostValidator = [
  body("content").notEmpty().withMessage("Content is required"),
];

export const searchPostValidator = [
  query("query").notEmpty().withMessage("Query is required"),
];
