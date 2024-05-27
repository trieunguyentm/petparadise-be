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
  "/pet-adoption-post-by-search",
  validators.getPetAdoptionPostBySearchValidator,
  petAdoptionControllers.handleGetPetAdoptionPostBySearch
);

petAdoptionRoute.get(
  "/pet-adoption-post/:postId",
  validators.getPetAdoptionPostByIdValidator,
  petAdoptionControllers.handleGetPetAdoptionPostById
);

petAdoptionRoute.delete(
  "/pet-adoption-post/:postId",
  validators.deletePetAdoptionPostByIdValidator,
  petAdoptionControllers.handleDeletePetAdoptionPostById
);

petAdoptionRoute.post(
  "/pet-adoption-post/comment",
  upload.array("photos"),
  validators.postComment,
  petAdoptionControllers.handleAddComment
);

petAdoptionRoute.get(
  "/pet-adoption-post/:postId/comment",
  validators.getComment,
  petAdoptionControllers.handleGetCommentByPost
);

petAdoptionRoute.get(
  "/:postId/adopted-pet-owner",
  validators.getAdoptedPetOwner,
  petAdoptionControllers.handleGetAdoptedPetOwner
);

petAdoptionRoute.get(
  "/:postId/confirm",
  validators.getConfirmByPostValidator,
  petAdoptionControllers.handleGetConfirmByPost
);

petAdoptionRoute.put(
  "/:postId/confirm",
  validators.confirmAdoptPet,
  petAdoptionControllers.handleConfirmAdoptPet
);

export default petAdoptionRoute;
