import * as validators from "../validators/payment-validators";
import * as paymentControllers from "../controllers/payment-controllers";
import { Router } from "express";
import { authenticate } from "../validators/middleware";

const paymentRoute = Router();

paymentRoute.post("/receive-hook", paymentControllers.handleReceiveHook);

paymentRoute.use(authenticate);

paymentRoute.post(
  "/create-payment-link",
  validators.createPaymentLinkValidator,
  paymentControllers.handleCreatePaymentLink
);

paymentRoute.post(
  "/direct-payment",
  validators.directPaymentValidator,
  paymentControllers.handleDirectPayment
);

export default paymentRoute;
