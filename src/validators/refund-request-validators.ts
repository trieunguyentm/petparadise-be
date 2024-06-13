import { body, param } from "express-validator";

export const createRefundRequest = [
  body("orderId").notEmpty().withMessage("Chưa cung cấp ID của đơn hàng"),
  body("bankCode")
    .notEmpty()
    .withMessage("Chưa cấp cung codeName của ngân hàng"),
  body("bankNumber").notEmpty().withMessage("Chưa cấp cấp số tài khoản"),
];

export const getRefundRequest = [
  param("orderId").notEmpty().withMessage("Chưa cung cấp ID của đơn hàng"),
];
