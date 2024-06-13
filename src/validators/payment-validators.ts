import { body } from "express-validator";

export const createPaymentLinkValidator = [
  body("sellerId").notEmpty().withMessage("ID người bán hàng không hợp lệ"),
  body("buyerNote")
    .optional()
    .isString()
    .withMessage("Lưu ý người mua không hợp lệ"),
  body("checkoutData")
    .exists()
    .withMessage("Nội dung thanh toán không hợp lệ")
    .isObject()
    .withMessage("Thông tin thanh toán không hợp lệ"),
  body("checkoutData.orderCode")
    .exists()
    .withMessage("Mã hóa đơn không hợp lệ")
    .isInt({ min: 0 })
    .withMessage("Mã hóa đơn không hợp lệ"),
  body("checkoutData.amount")
    .exists()
    .withMessage("Giá trị hóa đơn không hợp lệ")
    .isFloat({ gt: 0 })
    .withMessage("Giá trị hóa đơn không hợp lệ"),
  body("checkoutData.description")
    .exists()
    .withMessage("Mô tả của hóa đơn không hợp lệ")
    .isString()
    .withMessage("Mô tả của hóa đơn không hợp lệ"),
  body("checkoutData.cancelUrl")
    .exists()
    .withMessage("Chưa cung cấp cancelUrl"),
  body("checkoutData.returnUrl")
    .exists()
    .withMessage("Chưa cung cấp returnUrl"),
  body("checkoutData.signature")
    .optional()
    .isString()
    .withMessage("Chữ ký không hợp lệ"),
  body("checkoutData.items")
    .isArray()
    .withMessage("Mảng sản phẩm không hợp lệ"),
  body("checkoutData.items.*.name")
    .isString()
    .withMessage("Tên sản phẩm không hợp lệ"),
  body("checkoutData.items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Số lượng sản phẩm không hợp lệ"),
  body("checkoutData.items.*.price")
    .isFloat({ gt: 0 })
    .withMessage("Giá sản phẩm không hợp lệ"),
  body("checkoutData.buyerName")
    .isString()
    .withMessage("Tên người mua không hợp lệ"),
  body("checkoutData.buyerEmail")
    .isEmail()
    .withMessage("Địa chỉ email người mua không hợp lệ"),
  body("checkoutData.buyerPhone")
    .matches(/^(0[3|5|7|8|9])+([0-9]{8})$/)
    .withMessage("Số điện thoại người mua không hợp lệ"),
  body("checkoutData.buyerAddress")
    .isString()
    .withMessage("Địa chỉ người mua không hợp lệ"),
  body("checkoutData.expiredAt")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Thời hạn không hợp lệ"),
  body("listItem")
    .notEmpty()
    .withMessage("Danh sách sản phẩm không hợp lệ")
    .isObject()
    .withMessage("Danh sách sản phẩm không hợp lệ"),
];
