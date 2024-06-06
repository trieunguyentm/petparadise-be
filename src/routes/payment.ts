import * as validators from "../validators/payment-validators";
import * as paymentControllers from "../controllers/payment-controllers";
import { Router } from "express";
import { authenticate } from "../validators/middleware";

const paymentRoute = Router();

paymentRoute.post("/receive-hook", (req, res) => {
  console.log(req.body);
  return res.json();
});

paymentRoute.use(authenticate);

paymentRoute.post(
  "/create-payment-link",
  validators.createPaymentLinkValidator,
  paymentControllers.handleCreatePaymentLink
);

export default paymentRoute;
