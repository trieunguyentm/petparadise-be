import { body, param } from "express-validator";

export const registerValidator = [
  body("username")
    .isLength({ min: 6 })
    .withMessage("Username must be at least 6 characters long")
    .isAlphanumeric()
    .withMessage("Username must contain only letters and numbers")
    .notEmpty()
    .withMessage("Username is required"),
  body("email")
    .isEmail()
    .withMessage("Must be a valid email")
    .notEmpty()
    .withMessage("Email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .notEmpty()
    .withMessage("Password is required"),
];

export const verifyOTPValidator = [
  body("otpCode")
    .notEmpty()
    .withMessage("OTP code is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP code must be 6 characters long")
    .isNumeric()
    .withMessage("OTP code must contain only numbers"),
];

export const recoveryPasswordValidator = [
  body("email")
    .isEmail()
    .withMessage("Must be a valid email")
    .notEmpty()
    .withMessage("Email is required"),
];

export const confirmPasswordValidator = [
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .notEmpty()
    .withMessage("Password is required"),
];

export const loginValidator = [
  body("email")
    .isEmail()
    .withMessage("Must be a valid email")
    .notEmpty()
    .withMessage("Email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .notEmpty()
    .withMessage("Password is required"),
];
