import * as validators from "../validators/lostpet-validators";
import * as lostPetControllers from "../controllers/lostpet-controllers";
import { Router } from "express";
import { authenticate, upload } from "../validators/middleware";

const lostPetRoute = Router();

lostPetRoute.use(authenticate);

lostPetRoute.post(
  "/create-find-pet-post",
  upload.array("photos"),
  validators.createFindPetPostValidator,
  lostPetControllers.handleCreateFindPetPost
);

lostPetRoute.get("/find-pet-post", lostPetControllers.handleGetFindPetPost);

lostPetRoute.get(
  "/find-pet-post/:postId",
  validators.getFindPetPostByIdValidator,
  lostPetControllers.handleGetFindPetPostById
);

export default lostPetRoute;
