import { body, param } from "express-validator";

export const banUserValidator = [
  body("userId").notEmpty().withMessage("Chưa cung cấp ID người dùng"),
  body("timeBan")
    .isNumeric()
    .withMessage("Số giờ khóa tài khoản không hợp lệ")
    .custom((value) => value > 0)
    .withMessage("Số giờ khóa tài khoản phải lớn hơn 0"),
];

export const deleteReportValidator = [
  param("postId").notEmpty().withMessage("Chưa cung cấp ID bài viết"),
];

export const updateReportValidator = [
  body("newStatus")
    .isIn(["pending", "reviewing", "resolved"])
    .withMessage("Trạng thái cập nhật không hợp lệ"),
  body("reportId").notEmpty().withMessage("ID của báo cáo không hợp lệ"),
];

export const updateDrawMoneyHistoryValidator = [
  body("newStatus")
    .isIn(["pending", "completed", "failed"])
    .withMessage("Trạng thái cập nhật không hợp lệ"),
  body("drawMoneyHistoryId")
    .notEmpty()
    .withMessage("ID của yêu cầu nhận tiền không hợp lệ"),
];
