import * as validators from "../validators/refund-request-validators";
import * as refundRequestControllers from "../controllers/refund-request-controllers";
import { Router } from "express";
import { authenticate } from "../validators/middleware";

const refundRequestRoute = Router();

refundRequestRoute.use(authenticate);

refundRequestRoute.post(
  "/create",
  validators.createRefundRequest,
  refundRequestControllers.handleCreateRefundRequest
);

refundRequestRoute.get(
  "/get-refund-request-by-order/:orderId",
  validators.getRefundRequest,
  refundRequestControllers.handleGetRefundRequestByOrder
);

export default refundRequestRoute;
