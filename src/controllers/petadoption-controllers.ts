import { Response } from "express";
import {
  ErrorResponse,
  GenderPet,
  ReasonFindOwner,
  RequestCustom,
  SizePet,
  StatusPetAdoption,
  TypePet,
} from "../types";
import { validationResult } from "express-validator";
import { ERROR_CLIENT } from "../constants";
import {
  handleAddCommentService,
  handleConfirmAdoptPetService,
  handleCreatePetAdoptionPostService,
  handleDeletePetAdoptionPostByIdService,
  handleGetAdoptedPetOwnerService,
  handleGetCommentByPostService,
  handleGetConfirmByPostService,
  handleGetPetAdoptionPostByIdService,
  handleGetPetAdoptionPostBySearchService,
  handleGetPetAdoptionPostService,
} from "../services/petadoption-services";

export const handleCreatePetAdoptionPost = async (
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
      message: "Chưa cung cấp hình ảnh của thú cưng",
      error: "Chưa cung cấp hình ảnh của thú cưng",
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(response);
  }
  const {
    typePet,
    reason,
    genderPet,
    location,
    description,
    healthInfo,
    contactInfo,
  } = req.body;

  // Gọi service
  const result = await handleCreatePetAdoptionPostService({
    user,
    files,
    typePet,
    reason,
    genderPet,
    location,
    description,
    healthInfo,
    contactInfo,
  });

  // Kiểm tra kết quả và phản hồi tương ứng
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(200).json(result);
  }
};

export const handleGetPetAdoptionPost = async (
  req: RequestCustom,
  res: Response
) => {
  // Parse the query parameters and provide default values if necessary
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;

  const result = await handleGetPetAdoptionPostService({ limit, offset });

  // Check the result and respond accordingly
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(200).json(result);
  }
};

export const handleGetPetAdoptionPostById = async (
  req: RequestCustom,
  res: Response
) => {
  const { postId } = req.params;
  if (!postId) {
    const response: ErrorResponse = {
      success: false,
      message: "Chưa cung cấp ID bài viết",
      error: "Chưa cung cấp ID bài viết",
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(response);
  }

  const result = await handleGetPetAdoptionPostByIdService({ postId });

  // Check the result and respond accordingly
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(200).json(result);
  }
};

export const handleAddComment = async (req: RequestCustom, res: Response) => {
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
  } else {
    const files: Express.Multer.File[] | undefined = req.files as
      | Express.Multer.File[]
      | undefined;
    const { postId, content } = req.body;
    const result = await handleAddCommentService({
      user,
      postId,
      content,
      files,
    });
    if (!result.success) {
      return res.status(result.statusCode).json(result);
    } else {
      return res.status(result.statusCode).json(result);
    }
  }
};

export const handleGetCommentByPost = async (
  req: RequestCustom,
  res: Response
) => {
  const { postId } = req.params;
  if (!postId) {
    const response: ErrorResponse = {
      success: false,
      message: "Chưa cung cấp ID bài viết",
      error: "Chưa cung cấp ID bài viết",
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(response);
  }
  const result = await handleGetCommentByPostService({ postId });

  // Check the result and respond accordingly
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(200).json(result);
  }
};

export const handleDeletePetAdoptionPostById = async (
  req: RequestCustom,
  res: Response
) => {
  const { postId } = req.params;
  if (!postId) {
    const response: ErrorResponse = {
      success: false,
      message: "Chưa cung cấp ID bài viết",
      error: "Chưa cung cấp ID bài viết",
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(response);
  }
  const user = req.user;
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

  const result = await handleDeletePetAdoptionPostByIdService({ postId, user });

  // Check the result and respond accordingly
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(200).json(result);
  }
};

export const handleGetPetAdoptionPostBySearch = async (
  req: RequestCustom,
  res: Response
) => {
  const {
    petType = "all",
    gender = "all",
    size = "all",
    location = "",
    status = "all",
    reason = "all",
  } = req.query;

  // Parse the query parameters and provide default values if necessary
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;

  // Cast the parameters to their respective types
  const searchParams = {
    petType: petType as "all" | TypePet,
    gender: gender as "all" | GenderPet,
    size: size as "all" | SizePet,
    location: location as string,
    status: status as "all" | StatusPetAdoption,
    reason: reason as "all" | ReasonFindOwner,
    limit,
    offset,
  };

  const result = await handleGetPetAdoptionPostBySearchService(searchParams);

  // Check the result and respond accordingly
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(200).json(result);
  }
};

export const handleGetAdoptedPetOwner = async (
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

  // const user = req.user;
  // if (!user) {
  //   const response: ErrorResponse = {
  //     success: false,
  //     message: "Chưa cung cấp người dùng",
  //     error: "Chưa cung cấp người dùng",
  //     statusCode: 400,
  //     type: ERROR_CLIENT,
  //   };
  //   return res.status(400).json(response);
  // }
  const { postId } = req.params;
  const result = await handleGetAdoptedPetOwnerService({ postId });
  // Check the result and respond accordingly
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(200).json(result);
  }
};

export const handleGetConfirmByPost = async (
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
  const { postId } = req.params;
  const user = req.user;
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

  const result = await handleGetConfirmByPostService({ user, postId });

  // Check the result and respond accordingly
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(200).json(result);
  }
};

export const handleConfirmAdoptPet = async (
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
  const { postId } = req.params;
  const { confirmed } = req.body;
  const user = req.user;
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

  const result = await handleConfirmAdoptPetService({
    user,
    postId,
    confirmed,
  });

  // Check the result and respond accordingly
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(200).json(result);
  }
};
