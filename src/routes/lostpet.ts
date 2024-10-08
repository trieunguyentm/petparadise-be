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
  "/find-pet-post-by-search",
  validators.getFindPetPostBySearchValidator,
  lostPetControllers.handleGetFindPetPostBySearch
);

lostPetRoute.get(
  "/find-pet-post/:postId",
  validators.getFindPetPostByIdValidator,
  lostPetControllers.handleGetFindPetPostById
);

lostPetRoute.put(
  "/find-pet-post/:postId",
  validators.updateFindPetPostByIdValidator,
  lostPetControllers.handleUpdateFindPetPostById
);

lostPetRoute.delete(
  "/find-pet-post/:postId",
  validators.deleteFindPetPostByIdValidator,
  lostPetControllers.handleDeleteFindPetPostById
);

lostPetRoute.post(
  "/find-pet-post/comment",
  upload.array("photos"),
  validators.postComment,
  lostPetControllers.handleAddComment
);

lostPetRoute.get(
  "/find-pet-post/:postId/comment",
  validators.getComment,
  lostPetControllers.handleGetCommentByPost
);

export default lostPetRoute;
