import * as validators from "../validators/adoption-request-validators";
import * as adoptionRequestControllers from "../controllers/adoption-request-controllers";
import { Router } from "express";
import { authenticate, upload } from "../validators/middleware";

const adoptionRequestRoute = Router();

adoptionRequestRoute.use(authenticate);

adoptionRequestRoute.post(
  "/create-adoption-request",
  upload.array("photos"),
  validators.createAdoptionRequest,
  adoptionRequestControllers.handleCreateAdoptionRequest
);

adoptionRequestRoute.get(
  "/:postId",
  validators.handleGetAdoptionRequestValidator,
  adoptionRequestControllers.handleGetAdoptionRequestByPost
);

adoptionRequestRoute.post(
  "/handle/:requestId",
  validators.handleSetAdoptionRequestValidator,
  adoptionRequestControllers.handleSetAdoptionRequest
);

export default adoptionRequestRoute;
