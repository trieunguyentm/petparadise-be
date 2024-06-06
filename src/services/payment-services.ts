import { CheckoutRequestType } from "@payos/node/lib/type";
import { ErrorResponse, SuccessResponse } from "../types";
import { ERROR_SERVER, SUCCESS } from "../constants";
import dotenv from "dotenv";
import PayOS from "@payos/node";

dotenv.config();

const payos = new PayOS(
  process.env.PAYOS_CLIENT_ID as string,
  process.env.PAYOS_API_KEY as string,
  process.env.PAYOS_CHECKSUM_KEY as string
);

export const handleCreatePaymentLinkService = async ({
  buyerNote,
  checkoutData,
}: {
  buyerNote: string | undefined;
  checkoutData: CheckoutRequestType;
}) => {
  try {
    const paymentLink = await payos.createPaymentLink(checkoutData);

    const dataResponse: SuccessResponse = {
      success: true,
      message: "Get pet adoption post successfully",
      data: paymentLink.checkoutUrl,
      statusCode: 200,
      type: SUCCESS,
    };
    return dataResponse;
  } catch (error: any) {
    console.log(error);
    let dataResponse: ErrorResponse = {
      success: false,
      message: "Failed to create payment link",
      error: "Failed to create payment link: " + error.message,
      statusCode: 500,
      type: ERROR_SERVER,
    };
    return dataResponse;
  }
};
