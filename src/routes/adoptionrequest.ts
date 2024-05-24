import * as validators from "../validators/adoptionrequest-validators";
import * as adoptionRequestControllers from "../controllers/adoptionrequest-controllers";
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
