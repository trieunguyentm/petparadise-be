import { body, param } from "express-validator";

export const changePasswordValidator = [
  body("currentPassword")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .notEmpty()
    .withMessage("Password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long")
    .notEmpty()
    .withMessage("New password is required"),
];

export const likePostValidator = [
  body("postID").notEmpty().withMessage("Post ID is required"),
];
