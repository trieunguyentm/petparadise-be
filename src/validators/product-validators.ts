import { body, param, query } from "express-validator";

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

export const getProductValidator = [
  query("productType")
    .optional()
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
  query("minPrice").optional().isNumeric().withMessage("minPrice phải là số"),
  query("maxPrice").optional().isNumeric().withMessage("maxPrice phải là số"),
  query("name").optional().isString().withMessage("name phải là chuỗi"),
  query("seller")
    .optional()
    .isMongoId()
    .withMessage("seller phải là một ID hợp lệ"),
];

export const getProductByIdValidator = [
  param("productId").notEmpty().withMessage("productId must be a ID"),
];

export const addToCartValidator = [
  body("productId").notEmpty().withMessage("productId must be a ID"),
];

export const deleteCartValidator = [
  body("productId").notEmpty().withMessage("productId must be a ID"),
];

export const editProductValidator = [
  param("productId").notEmpty().withMessage("productId must be a ID"),
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

export const deleteProductValidator = [
  param("productId").notEmpty().withMessage("ID sản phẩm không hợp lệ"),
];

export const setOrderValidator = [
  param("orderId").notEmpty().withMessage("ID đơn hàng không hợp lệ"),
  body("status")
    .notEmpty()
    .withMessage("Trạng thái đơn hàng là bắt buộc")
    .isIn(["processed", "shipped", "delivered", "cancelled"])
    .withMessage("Trạng thái đơn hàng không hợp lệ"),
];

export const confirmOrderValidator = [
  body("typeConfirm")
    .notEmpty()
    .withMessage("Kiểu xác nhận là bắt buộc")
    .isIn(["accept", "cancel"])
    .withMessage("Kiểu xác nhận không hợp lệ"),
  param("orderId").notEmpty().withMessage("Cần cung cấp orderId"),
];
