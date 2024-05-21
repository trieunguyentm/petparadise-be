import * as validators from "../validators/petadoption-validators";
import * as petAdoptionControllers from "../controllers/petadoption-controllers";
import { Router } from "express";
import { authenticate, upload } from "../validators/middleware";

const petAdoptionRoute = Router();

petAdoptionRoute.use(authenticate);

petAdoptionRoute.post(
  "/create-pet-adoption-post",
  upload.array("photos"),
  validators.createPetAdoptioPostValidator,
  petAdoptionControllers.handleCreatePetAdoptionPost
);

petAdoptionRoute.get(
  "/pet-adoption-post",
  petAdoptionControllers.handleGetPetAdoptionPost
);

petAdoptionRoute.get(
  "/pet-adoption-post/:postId",
  validators.getPetAdoptionPostByIdValidator,
  petAdoptionControllers.handleGetPetAdoptionPostById
);

export default petAdoptionRoute;
