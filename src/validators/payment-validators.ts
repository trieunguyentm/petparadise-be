import { body } from "express-validator";

export const createPaymentLinkValidator = [
  body("sellerId").notEmpty().withMessage("sellerId must be a ID"),
  body("buyerNote")
    .optional()
    .isString()
    .withMessage("Buyer note must be a string"),
  body("checkoutData")
    .exists()
    .withMessage("Checkout data is required")
    .isObject()
    .withMessage("Checkout data must be an object"),
  body("checkoutData.orderCode")
    .exists()
    .withMessage("Order code is required")
    .isInt({ min: 0 })
    .withMessage("Order code must be a positive integer"),
  body("checkoutData.amount")
    .exists()
    .withMessage("Amount is required")
    .isFloat({ gt: 0 })
    .withMessage("Amount must be a positive number"),
  body("checkoutData.description")
    .exists()
    .withMessage("Description is required")
    .isString()
    .withMessage("Description must be a string"),
  body("checkoutData.cancelUrl").exists().withMessage("Cancel URL is required"),
  body("checkoutData.returnUrl").exists().withMessage("Return URL is required"),
  body("checkoutData.signature")
    .optional()
    .isString()
    .withMessage("Signature must be a string"),
  body("checkoutData.items")
    .optional()
    .isArray()
    .withMessage("Items must be an array"),
  body("checkoutData.items.*.name")
    .optional()
    .isString()
    .withMessage("Item name must be a string"),
  body("checkoutData.items.*.quantity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Item quantity must be a positive integer"),
  body("checkoutData.items.*.price")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("Item price must be a positive number"),
  body("checkoutData.buyerName")
    .optional()
    .isString()
    .withMessage("Buyer name must be a string"),
  body("checkoutData.buyerEmail")
    .optional()
    .isEmail()
    .withMessage("Buyer email must be a valid email address"),
  body("checkoutData.buyerPhone")
    .optional()
    .matches(/^(0[3|5|7|8|9])+([0-9]{8})$/)
    .withMessage("Buyer phone must be a valid phone number"),
  body("checkoutData.buyerAddress")
    .optional()
    .isString()
    .withMessage("Buyer address must be a string"),
  body("checkoutData.expiredAt")
    .optional()
    .isInt({ min: 0 })
    .withMessage("ExpiredAt must be a positive integer"),
];
