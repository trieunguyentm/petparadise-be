import { body, param, query } from "express-validator";

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

export const savePostValidator = [
  body("postID").notEmpty().withMessage("Post ID is required"),
];

export const followValidator = [
  body("peopleID").notEmpty().withMessage("People ID is required"),
];

export const searchValidator = [
  query("query").notEmpty().withMessage("Query is required"),
];
