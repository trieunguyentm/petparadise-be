import { body, query } from "express-validator";

export const createPostValidator = [
  body("content").notEmpty().withMessage("Content is required"),
];

export const searchPostValidator = [
  query("query").notEmpty().withMessage("Query is required"),
];

export const addCommentValidator = [
  body("content").notEmpty().withMessage("Content is required"),
  body("postId").notEmpty().withMessage("Post Id is required"),
];
