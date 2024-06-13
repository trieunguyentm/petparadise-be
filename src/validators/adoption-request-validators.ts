import { body, param } from "express-validator";

export const createAdoptionRequest = [
  body("petAdoptionPost").notEmpty().withMessage("Chưa cung cấp petAdoptionPost"),
  body("type")
    .isIn(["reclaim-pet", "adopt-pet"])
    .withMessage("Kiểu bài đăng không hợp lệ"),
  body("descriptionForPet")
    .optional()
    .isString()
    .withMessage("Mô tả về thú cưng không hợp lệ"),
  body("descriptionForUser")
    .optional()
    .isString()
    .withMessage("Mô tả về người dùng không hợp lệ"),
  body("contactInfo")
    .isString()
    .withMessage("Chưa cung cấp thông tin liên hệ "),
];

export const handleGetAdoptionRequestValidator = [
  param("postId").notEmpty().withMessage("Cần cung cấp ID bài viết"),
];

export const handleSetAdoptionRequestValidator = [
  body("status")
    .isIn(["approved", "rejected"])
    .withMessage("Trạng thái yêu cầu không hợp lệ"),
  param("requestId").notEmpty().withMessage("Id của yêu cầu không hợp lệ"),
];
