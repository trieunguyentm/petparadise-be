import { body, query } from "express-validator";

export const createPostValidator = [
  body("content").notEmpty().withMessage("Nội dung bài viết không hợp lệ"),
];

export const searchPostValidator = [
  query("query").notEmpty().withMessage("Truy vấn tìm kiếm không hợp lệ"),
];

export const addCommentValidator = [
  body("content").notEmpty().withMessage("Nội dung bài viết không hợp lệ"),
  body("postId").notEmpty().withMessage("Chưa cung cấp ID bài viết"),
];
