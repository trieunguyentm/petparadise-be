import { Response } from "express";
import { ErrorResponse, ProductType, RequestCustom } from "../types";
import { validationResult } from "express-validator";
import { ERROR_CLIENT } from "../constants";
import {
  handleAddToCartService,
  handleConfirmOrderService,
  handleCreateProductService,
  handleDeleteCartService,
  handleDeleteProductService,
  handleEditProductService,
  handleGetMyOrderService,
  handleGetProductByIdService,
  handleGetProductService,
  handleGetPurchasedOrderService,
  handleSetOrderService,
} from "../services/product-services";

export const handleCreateProduct = async (
  req: RequestCustom,
  res: Response
) => {
  // Kiểm tra kết quả validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response: ErrorResponse = {
      success: false,
      message: `Thông tin không hợp lệ: ${errors.array()[0].msg}`,
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
      message: "Chưa cung cấp người dùng",
      error: "Chưa cung cấp người dùng",
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(response);
  }
  const files: Express.Multer.File[] = req.files as Express.Multer.File[];
  if (files.length === 0 || !files) {
    const response: ErrorResponse = {
      success: false,
      message: "Chưa cung cấp hình ảnh của sản phẩm",
      error: "Chưa cung cấp hình ảnh của sản phẩm",
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
      message: "Chưa cung cấp đầy đủ thông tin giảm giá của sản phẩm",
      error: "Chưa cung cấp đầy đủ thông tin giảm giá của sản phẩm",
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

export const handleGetProduct = async (req: RequestCustom, res: Response) => {
  // Kiểm tra kết quả validation
  const errors = validationResult(req);
  // Nếu có lỗi validation, gửi lại lỗi cho client
  if (!errors.isEmpty()) {
    const response: ErrorResponse = {
      success: false,
      message: `Thông tin không hợp lệ: ${errors.array()[0].msg}`,
      error: errors.array()[0].msg,
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(response);
  }
  const { user } = req;
  if (!user) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Chưa cung cấp người dùng",
      error: "Chưa cung cấp người dùng",
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(dataResponse);
  }
  // Parse the query parameters and provide default values if necessary
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;

  const { productType, minPrice, maxPrice, name, seller } = req.query as {
    productType: ProductType | undefined;
    minPrice: number | undefined;
    maxPrice: number | undefined;
    name: string | undefined;
    seller: string | undefined;
  };

  const result = await handleGetProductService({
    offset,
    limit,
    productType,
    minPrice,
    maxPrice,
    name,
    seller,
  });

  // Check the result and respond accordingly
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(200).json(result);
  }
};

export const handleGetProductById = async (
  req: RequestCustom,
  res: Response
) => {
  // Kiểm tra kết quả validation
  const errors = validationResult(req);
  // Nếu có lỗi validation, gửi lại lỗi cho client
  if (!errors.isEmpty()) {
    const response: ErrorResponse = {
      success: false,
      message: `Thông tin không hợp lệ: ${errors.array()[0].msg}`,
      error: errors.array()[0].msg,
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(response);
  }
  const { productId } = req.params;
  if (!productId) {
    const response: ErrorResponse = {
      success: false,
      message: "Chưa cung cấp ID của sản phẩm",
      error: "Chưa cung cấp ID của sản phẩm",
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(response);
  }

  const result = await handleGetProductByIdService({ productId });

  // Check the result and respond accordingly
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(200).json(result);
  }
};

export const handleAddToCart = async (req: RequestCustom, res: Response) => {
  // Kiểm tra kết quả validation
  const errors = validationResult(req);
  // Nếu có lỗi validation, gửi lại lỗi cho client
  if (!errors.isEmpty()) {
    const response: ErrorResponse = {
      success: false,
      message: `Thông tin không hợp lệ: ${errors.array()[0].msg}`,
      error: errors.array()[0].msg,
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(response);
  }
  const { productId } = req.body;
  if (!productId) {
    const response: ErrorResponse = {
      success: false,
      message: "Chưa cung cấp ID của sản phẩm",
      error: "Chưa cung cấp ID của sản phẩm",
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(response);
  }

  const { user } = req;
  if (!user) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Chưa cung cấp người dùng",
      error: "Chưa cung cấp người dùng",
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(dataResponse);
  }

  const result = await handleAddToCartService({ user, productId });

  // Check the result and respond accordingly
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(200).json(result);
  }
};

export const handleDeleteCart = async (req: RequestCustom, res: Response) => {
  // Kiểm tra kết quả validation
  const errors = validationResult(req);
  // Nếu có lỗi validation, gửi lại lỗi cho client
  if (!errors.isEmpty()) {
    const response: ErrorResponse = {
      success: false,
      message: `Thông tin không hợp lệ: ${errors.array()[0].msg}`,
      error: errors.array()[0].msg,
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(response);
  }
  const { productId } = req.body;
  if (!productId) {
    const response: ErrorResponse = {
      success: false,
      message: "Chưa cung cấp ID của sản phẩm",
      error: "Chưa cung cấp ID của sản phẩm",
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(response);
  }

  const { user } = req;
  if (!user) {
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Chưa cung cấp người dùng",
      error: "Chưa cung cấp người dùng",
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(dataResponse);
  }

  const result = await handleDeleteCartService({ user, productId });

  // Kiểm tra kết quả và phản hồi tương ứng
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(200).json(result);
  }
};

export const handleEditProduct = async (req: RequestCustom, res: Response) => {
  // Kiểm tra kết quả validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response: ErrorResponse = {
      success: false,
      message: `Thông tin không hợp lệ: ${errors.array()[0].msg}`,
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
      message: "Chưa cung cấp người dùng",
      error: "Chưa cung cấp người dùng",
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(response);
  }
  const files: Express.Multer.File[] = req.files as Express.Multer.File[];
  if (files.length === 0 || !files) {
    const response: ErrorResponse = {
      success: false,
      message: "Chưa cung cấp hình ảnh của sản phẩm",
      error: "Chưa cung cấp hình ảnh của sản phẩm",
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
      message: "Chưa cung cấp đầy đủ thông tin giảm giá của sản phẩm",
      error: "Chưa cung cấp đầy đủ thông tin giảm giá của sản phẩm",
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(response);
  }

  const { productId } = req.params;

  const result = await handleEditProductService({
    productId,
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

export const handleDeleteProduct = async (
  req: RequestCustom,
  res: Response
) => {
  // Kiểm tra kết quả validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response: ErrorResponse = {
      success: false,
      message: `Thông tin không hợp lệ: ${errors.array()[0].msg}`,
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
      message: "Chưa cung cấp người dùng",
      error: "Chưa cung cấp người dùng",
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(response);
  }

  const { productId } = req.params;

  const result = await handleDeleteProductService({ productId, user });

  // Kiểm tra kết quả và phản hồi tương ứng
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(200).json(result);
  }
};

export const handleGetPurchasedOrder = async (
  req: RequestCustom,
  res: Response
) => {
  const { user } = req;
  if (!user) {
    const response: ErrorResponse = {
      success: false,
      message: "Chưa cung cấp người dùng",
      error: "Chưa cung cấp người dùng",
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(response);
  }
  const result = await handleGetPurchasedOrderService({ user });

  // Kiểm tra kết quả và phản hồi tương ứng
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(200).json(result);
  }
};

export const handleGetMyOrder = async (req: RequestCustom, res: Response) => {
  const { user } = req;
  if (!user) {
    const response: ErrorResponse = {
      success: false,
      message: "Chưa cung cấp người dùng",
      error: "Chưa cung cấp người dùng",
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(response);
  }
  const result = await handleGetMyOrderService({ user });

  // Kiểm tra kết quả và phản hồi tương ứng
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(200).json(result);
  }
};

export const handleSetOrder = async (req: RequestCustom, res: Response) => {
  // Kiểm tra kết quả validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response: ErrorResponse = {
      success: false,
      message: `Thông tin không hợp lệ: ${errors.array()[0].msg}`,
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
      message: "Chưa cung cấp người dùng",
      error: "Chưa cung cấp người dùng",
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(response);
  }

  const { orderId } = req.params;
  const { status } = req.body;

  const result = await handleSetOrderService({ user, orderId, status });

  // Kiểm tra kết quả và phản hồi tương ứng
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(200).json(result);
  }
};

export const handleConfirmOrder = async (req: RequestCustom, res: Response) => {
  // Kiểm tra kết quả validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response: ErrorResponse = {
      success: false,
      message: `Thông tin không hợp lệ: ${errors.array()[0].msg}`,
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
      message: "Chưa cung cấp người dùng",
      error: "Chưa cung cấp người dùng",
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(response);
  }

  const { typeConfirm } = req.body;
  const { orderId } = req.params;

  const result = await handleConfirmOrderService({
    user,
    typeConfirm,
    orderId,
  });

  // Kiểm tra kết quả và phản hồi tương ứng
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(200).json(result);
  }
};
