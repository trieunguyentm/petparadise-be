import { body } from "express-validator";

export const createProductValidator = [
  body("name")
    .notEmpty()
    .withMessage("Tên sản phẩm là bắt buộc")
    .isString()
    .withMessage("Tên sản phẩm phải là chuỗi"),
  body("description")
    .notEmpty()
    .withMessage("Mô tả sản phẩm là bắt buộc")
    .isString()
    .withMessage("Mô tả sản phẩm phải là chuỗi"),
  body("productType")
    .notEmpty()
    .withMessage("Loại sản phẩm là bắt buộc")
    .isIn([
      "food",
      "toys",
      "medicine",
      "accessories",
      "housing",
      "training",
      "other",
    ])
    .withMessage("Loại sản phẩm không hợp lệ"),
  body("price")
    .notEmpty()
    .withMessage("Giá sản phẩm là bắt buộc")
    .isNumeric()
    .withMessage("Giá sản phẩm phải là số"),
  body("discountRate")
    .optional()
    .isNumeric()
    .withMessage("Tỉ lệ giảm giá phải là số")
    .custom((value) => value >= 0 && value <= 100)
    .withMessage("Tỉ lệ giảm giá phải nằm trong khoảng từ 0 đến 100"),
  body("discountStartDate")
    .optional()
    .isISO8601()
    .withMessage("Ngày bắt đầu giảm giá phải là ngày hợp lệ"),
  body("discountEndDate")
    .optional()
    .isISO8601()
    .withMessage("Ngày kết thúc giảm giá phải là ngày hợp lệ")
    .custom((value, { req }) => {
      const startDate = new Date(req.body.discountStartDate);
      const endDate = new Date(value);
      return endDate > startDate;
    })
    .withMessage("Ngày kết thúc phải sau ngày bắt đầu"),
  body("stock")
    .notEmpty()
    .withMessage("Số lượng sản phẩm là bắt buộc")
    .isNumeric()
    .withMessage("Số lượng sản phẩm phải là số")
    .custom((value) => value >= 0)
    .withMessage("Số lượng sản phẩm phải lớn hơn hoặc bằng 0"),
];
