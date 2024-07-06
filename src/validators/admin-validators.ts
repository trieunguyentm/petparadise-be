import { body, param } from "express-validator";

export const banUserValidator = [
  body("userId").notEmpty().withMessage("Chưa cung cấp ID người dùng"),
  body("timeBan")
    .isNumeric()
    .withMessage("Số giờ khóa tài khoản không hợp lệ")
    .custom((value) => value > 0)
    .withMessage("Số giờ khóa tài khoản phải lớn hơn 0"),
];

export const deletePostValidator = [
  param("postId").notEmpty().withMessage("Chưa cung cấp ID bài viết"),
];
