import { Response } from "express";
import {
  ErrorResponse,
  GenderPet,
  RequestCustom,
  SizePet,
  TypePet,
} from "../types";
import { validationResult } from "express-validator";
import { ERROR_CLIENT } from "../constants";
import {
  handleAddCommentService,
  handleCreateFindPetPostService,
  handleDeleteFindPetPostByIdService,
  handleGetCommentByPostService,
  handleGetFindPetPostByIdService,
  handleGetFindPetPostBySearchService,
  handleGetFindPetPostService,
  handleUpdateFindPetPostByIdService,
} from "../services/lostpet-services";

export const handleCreateFindPetPost = async (
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
      message: "Not provide image of pet",
      error: "Not provide image of pet",
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(response);
  }
  // Lấy thông tin từ body
  const {
    typePet,
    genderPet,
    sizePet,
    lastSeenLocation,
    lastSeenDate,
    description,
    contactInfo,
  } = req.body;

  // Gọi service
  const result = await handleCreateFindPetPostService({
    user,
    files,
    typePet,
    genderPet,
    sizePet,
    lastSeenLocation,
    lastSeenDate,
    description,
    contactInfo,
  });
  // Kiểm tra kết quả và phản hồi tương ứng
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(200).json(result);
  }
};

export const handleGetFindPetPost = async (
  req: RequestCustom,
  res: Response
) => {
  // Parse the query parameters and provide default values if necessary
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;

  const result = await handleGetFindPetPostService({ limit, offset });

  // Check the result and respond accordingly
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(200).json(result);
  }
};

export const handleGetFindPetPostBySearch = async (
  req: RequestCustom,
  res: Response
) => {
  const {
    petType = "all",
    gender = "all",
    size = "all",
    lastSeenLocation = "",
    lastSeenDate = "",
  } = req.query;

  // Cast the parameters to their respective types
  const searchParams = {
    petType: petType as "all" | TypePet,
    gender: gender as "all" | GenderPet,
    size: size as "all" | SizePet,
    lastSeenLocation: lastSeenLocation as string,
    lastSeenDate: lastSeenDate ? new Date(lastSeenDate as string) : undefined,
  };

  const result = await handleGetFindPetPostBySearchService(searchParams);

  // Check the result and respond accordingly
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(200).json(result);
  }
};

export const handleGetFindPetPostById = async (
  req: RequestCustom,
  res: Response
) => {
  const { postId } = req.params;
  if (!postId) {
    const response: ErrorResponse = {
      success: false,
      message: "Not provide post Id",
      error: "Not provide post Id",
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(response);
  }

  const result = await handleGetFindPetPostByIdService({ postId });

  // Check the result and respond accordingly
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(200).json(result);
  }
};

export const handleUpdateFindPetPostById = async (
  req: RequestCustom,
  res: Response
) => {
  const { postId } = req.params;
  if (!postId) {
    const response: ErrorResponse = {
      success: false,
      message: "Not provide post Id",
      error: "Not provide post Id",
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(response);
  }
  const user = req.user;
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

  const result = await handleUpdateFindPetPostByIdService({ postId, user });

  // Check the result and respond accordingly
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(200).json(result);
  }
};

export const handleDeleteFindPetPostById = async (
  req: RequestCustom,
  res: Response
) => {
  const { postId } = req.params;
  if (!postId) {
    const response: ErrorResponse = {
      success: false,
      message: "Not provide post Id",
      error: "Not provide post Id",
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(response);
  }
  const user = req.user;
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

  const result = await handleDeleteFindPetPostByIdService({ postId, user });

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
      message: `Invalid data: ${errors.array()[0].msg}`,
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
      message: "Not provide user",
      error: "Not provide user",
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
      message: "Not provide post Id",
      error: "Not provide post Id",
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
