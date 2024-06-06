import { Response } from "express";
import { ErrorResponse, RequestCustom } from "../types";
import { validationResult } from "express-validator";
import { ERROR_CLIENT } from "../constants";
import { CheckoutRequestType } from "@payos/node/lib/type";
import { handleCreatePaymentLinkService } from "../services/payment-services";

export const handleCreatePaymentLink = async (
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

  const sellerId = req.body.sellerId as string;
  const buyerNote = req.body.buyerNote as string | undefined;
  const checkoutData = req.body.checkoutData as CheckoutRequestType;

  const result = await handleCreatePaymentLinkService({
    buyerNote,
    checkoutData,
  });

  // Check the result and respond accordingly
  if (!result.success) {
    return res.status(result.statusCode).json(result);
  } else {
    return res.status(200).json(result);
  }
};
