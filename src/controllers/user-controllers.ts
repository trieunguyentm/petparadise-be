import { Response } from "express";
import { ErrorResponse, RequestCustom } from "../types";
import { ERROR_CLIENT } from "../constants";
import {
  handleAddFavoriteProductService,
  handleChangePasswordService,
  handleCreateReportService,
  handleCreateRequestDrawMoneyService,
  handleFollowService,
  handleGetCartService,
  handleGetDetailInfoPeopleService,
  handleGetFavoriteProductService,
  handleGetNotificationService,
  handleGetOtherUserBySearchService,
  handleGetOtherUserService,
  handleGetUserService,
  handleLikePostService,
  handleLogoutAllDeviceService,
  handleLogoutService,
  handleSavePostService,
  handleSearchUserService,
  handleSeenNotificationService,
  handleUpdateService,
} from "../services/user-services";
import { validationResult } from "express-validator";

export const handleGetUser = async (req: RequestCustom, res: Response) => {
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
    const result = await handleGetUserService({ user });
    if (!result.success) {
      return res.status(result.statusCode).json(result);
    } else {
      return res.status(result.statusCode).json(result);
    }
  }
};

export const handleChangePassword = async (
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
  const { user } = req;
  const { currentPassword, newPassword } = req.body;
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
    const result = await handleChangePasswordService({
      user,
      newPassword,
      currentPassword,
    });
    if (!result.success) {
      return res.status(result.statusCode).json(result);
    } else {
      return res.status(result.statusCode).json(result);
    }
  }
};

export const handleUpdate = async (req: RequestCustom, res: Response) => {
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
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Chưa cung cấp người dùng",
      error: "Chưa cung cấp người dùng",
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(dataResponse);
  }

  const file = req.file;
  const { typePet, location } = req.body;
  const result = await handleUpdateService({ user, file, location, typePet });
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(result.statusCode).json(result);
  }
};

export const handleLikePost = async (req: RequestCustom, res: Response) => {
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
  const { postID } = req.body;
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
    const result = await handleLikePostService({ user, postID });
    if (!result.success) {
      return res.status(result.statusCode).json(result);
    } else {
      return res.status(result.statusCode).json(result);
    }
  }
};

export const handleSavePost = async (req: RequestCustom, res: Response) => {
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
  const { postID } = req.body;
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
    const result = await handleSavePostService({ user, postID });
    if (!result.success) {
      return res.status(result.statusCode).json(result);
    } else {
      return res.status(result.statusCode).json(result);
    }
  }
};

export const handleGetOtherUser = async (req: RequestCustom, res: Response) => {
  // Parse the query parameters and provide default values if necessary
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;
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
    const result = await handleGetOtherUserService({ user, limit, offset });
    if (!result.success) {
      return res.status(result.statusCode).json(result);
    } else {
      return res.status(result.statusCode).json(result);
    }
  }
};

export const handleGetOtherUserBySearch = async (
  req: RequestCustom,
  res: Response
) => {
  const { search } = req.params;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;
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
    const result = await handleGetOtherUserBySearchService({
      user,
      search,
      offset,
      limit,
    });
    if (!result.success) {
      return res.status(result.statusCode).json(result);
    } else {
      return res.status(result.statusCode).json(result);
    }
  }
};

export const handleFollow = async (req: RequestCustom, res: Response) => {
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
  const { peopleID } = req.body;
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
    if (user.id === peopleID) {
      let dataResponse: ErrorResponse = {
        success: false,
        message: "Không thể theo dõi bản thân",
        error: "Không thể theo dõi bản thân",
        statusCode: 400,
        type: ERROR_CLIENT,
      };
      return res.status(400).json(dataResponse);
    }
    const result = await handleFollowService({ user, peopleID });
    if (!result.success) {
      return res.status(result.statusCode).json(result);
    } else {
      return res.status(result.statusCode).json(result);
    }
  }
};

export const handleGetNotification = async (
  req: RequestCustom,
  res: Response
) => {
  const { user } = req;
  // Parse the query parameters and provide default values if necessary
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;
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
    const result = await handleGetNotificationService({ user, limit, offset });
    if (!result.success) {
      return res.status(result.statusCode).json(result);
    } else {
      return res.status(result.statusCode).json(result);
    }
  }
};

export const handleSeenNotification = async (
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
  const { user } = req;
  const { notificationId } = req.params;
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
    const result = await handleSeenNotificationService({
      user,
      notificationId,
    });
    if (!result.success) {
      return res.status(result.statusCode).json(result);
    } else {
      return res.status(result.statusCode).json(result);
    }
  }
};

export const handleLogout = async (req: RequestCustom, res: Response) => {
  const tokenId = req.cookies["t"];
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
    const result = await handleLogoutService({ user, tokenId });
    if (!result.success) {
      return res.status(result.statusCode).json(result);
    } else {
      res.cookie("t", "", { maxAge: 0 });
      return res.status(result.statusCode).json(result);
    }
  }
};

export const handleLogoutAllDevice = async (
  req: RequestCustom,
  res: Response
) => {
  const tokenId = req.cookies["t"];
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
    const result = await handleLogoutAllDeviceService({ user, tokenId });
    if (!result.success) {
      return res.status(result.statusCode).json(result);
    } else {
      res.cookie("t", "", { maxAge: 0 });
      return res.status(result.statusCode).json(result);
    }
  }
};

export const handleSearchUser = async (req: RequestCustom, res: Response) => {
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
  const { query } = req.query;
  // Lấy query từ req.query và đảm bảo nó là một chuỗi
  if (typeof query !== "string") {
    const response: ErrorResponse = {
      success: false,
      message: "Truy vấn không hợp lệ",
      error: "Truy vấn không hợp lệ",
      statusCode: 400,
      type: ERROR_CLIENT,
    };
    return res.status(400).json(response);
  }
  const result = await handleSearchUserService({ query });
  // Check the result and respond accordingly
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(200).json(result);
  }
};

export const handleGetCart = async (req: RequestCustom, res: Response) => {
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

  const result = await handleGetCartService({ user });

  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(result.statusCode).json(result);
  }
};

export const handleAddFavoriteProduct = async (
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

  const result = await handleAddFavoriteProductService({ user, productId });

  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(result.statusCode).json(result);
  }
};

export const handleGetFavoriteProduct = async (
  req: RequestCustom,
  res: Response
) => {
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

  const result = await handleGetFavoriteProductService({ user });

  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(result.statusCode).json(result);
  }
};

export const handleGetDetailInfoPeople = async (
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
  const { username } = req.params;
  const result = await handleGetDetailInfoPeopleService({ username });
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(result.statusCode).json(result);
  }
};

export const handleCreateReport = async (req: RequestCustom, res: Response) => {
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
  const { description, link } = req.body;
  const result = await handleCreateReportService({ user, description, link });
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(result.statusCode).json(result);
  }
};

export const handleCreateRequestDrawMoney = async (
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
  const { amount, bankCode, accountNumber, accountName } = req.body;
  const result = await handleCreateRequestDrawMoneyService({
    user,
    amount,
    bankCode,
    accountNumber,
    accountName,
  });
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(result.statusCode).json(result);
  }
};
