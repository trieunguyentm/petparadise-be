import { Response } from "express";
import { ErrorResponse, RequestCustom } from "../types";
import { validationResult } from "express-validator";
import { ERROR_CLIENT } from "../constants";
import { handleCreateProductService } from "../services/product-services";

export const handleCreateProduct = async (
  req: RequestCustom,
  res: Response
) => {
  // Kiểm tra kết quả validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response: ErrorResponse = {
      success: false,
      message: `Invalid data: ${errors.array()[0].msg}`,
      error: errors.array()[0].msg,
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(response);
  }
  const { user } = req;
  if (!user) {
    const response: ErrorResponse = {
      success: false,
      message: "Not provide user",
      error: "Not provide user",
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(response);
  }
  const files: Express.Multer.File[] = req.files as Express.Multer.File[];
  if (files.length === 0 || !files) {
    const response: ErrorResponse = {
      success: false,
      message: "Not provide image of product",
      error: "Not provide image of product",
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(response);
  }
  // Lấy thông tin từ body
  const {
    name,
    description,
    productType,
    price,
    discountRate,
    discountStartDate,
    discountEndDate,
    stock,
  } = req.body;

  if (
    discountRate &&
    discountRate > 0 &&
    (!discountStartDate || !discountEndDate)
  ) {
    const response: ErrorResponse = {
      success: false,
      message: "Not provide promotion information",
      error: "Not provide promotion information",
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(response);
  }

  const result = await handleCreateProductService({
    user,
    name,
    description,
    productType,
    price,
    discountRate,
    discountStartDate,
    discountEndDate,
    stock,
    images: files,
  });

  // Kiểm tra kết quả và phản hồi tương ứng
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(200).json(result);
  }
};
