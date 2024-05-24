import { validationResult } from "express-validator";
import { ErrorResponse, RequestCustom } from "../types";
import { ERROR_CLIENT } from "../constants";
import { Response } from "express";
import { handleCreateAdoptionRequestService } from "../services/adoptionrequest-services";

export const handleCreateAdoptionRequest = async (
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
  const files = req.files as Express.Multer.File[] | undefined;
  const {
    petAdoptionPost,
    descriptionForPet,
    descriptionForUser,
    type,
    contactInfo,
  } = req.body;

  if (type === "reclaim-pet") {
    if (!descriptionForPet || !files || files.length === 0) {
      const response: ErrorResponse = {
        success: false,
        message: "Please provide a description for pet and upload image pet",
        error: "Not provide image or description for pet",
        statusCode: 400,
        type: ERROR_CLIENT,
      };
      return res.status(400).json(response);
    }
  }
  if (type === "adopt-pet") {
    if (!descriptionForUser) {
      const response: ErrorResponse = {
        success: false,
        message: "Please provide a description",
        error: "Not provide description",
        statusCode: 400,
        type: ERROR_CLIENT,
      };
      return res.status(400).json(response);
    }
  }

  const result = await handleCreateAdoptionRequestService({
    user,
    files,
    petAdoptionPost,
    descriptionForPet,
    descriptionForUser,
    type,
    contactInfo,
  });

  // Kiểm tra kết quả và phản hồi tương ứng
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(200).json(result);
  }
};
