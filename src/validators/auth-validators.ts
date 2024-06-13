import { body, param } from "express-validator";

export const registerValidator = [
  body("username")
    .isLength({ min: 6 })
    .withMessage("Tên người dùng phải có ít nhất 6 ký tự")
    .isAlphanumeric()
    .withMessage("Tên người dùng không được chứa ký tự đặc biệt")
    .notEmpty()
    .withMessage("Cần cung cấp tên người dùng"),
  body("email")
    .isEmail()
    .withMessage("Địa chỉ email không hợp lệ")
    .notEmpty()
    .withMessage("Cần cung cấp địa chỉ email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Mật khẩu phải có ít nhất 6 ký tự")
    .notEmpty()
    .withMessage("Cần cung cấp mật khẩu"),
];

export const verifyOTPValidator = [
  body("otpCode")
    .notEmpty()
    .withMessage("Cần cung cấp mã OTP")
    .isLength({ min: 6, max: 6 })
    .withMessage("Mã OTP phải có 6 ký tự")
    .isNumeric()
    .withMessage("Mã OTP chỉ được chứa số"),
];

export const recoveryPasswordValidator = [
  body("email")
    .isEmail()
    .withMessage("Địa chỉ email phải chính xác")
    .notEmpty()
    .withMessage("Cần cung cấp địa chỉ email"),
];

export const confirmPasswordValidator = [
  body("password")
    .isLength({ min: 6 })
    .withMessage("Mật khẩu phải có ít nhất 6 ký tự")
    .notEmpty()
    .withMessage("Cần cung cấp mật khẩu"),
];

export const loginValidator = [
  body("email")
    .isEmail()
    .withMessage("Địa chỉ email không hợp lệ")
    .notEmpty()
    .withMessage("Cần cung cấp địa chỉ email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Mật khẩu phải có ít nhất 6 ký tự")
    .notEmpty()
    .withMessage("Cần cung cấp mật khẩu"),
];

export const verifyValidator = [
  body("cookieName").notEmpty().withMessage("Chưa cung cấp CookieName"),
];
