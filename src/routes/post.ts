import * as postControllers from "../controllers/post-controllers";
import * as validators from "../validators/post-validator";
import { Router } from "express";
import { authenticate, upload } from "../validators/middleware";

const postRoute = Router();

postRoute.use(authenticate);

postRoute.post(
  "/create",
  upload.array("photos"),
  validators.createPostValidator,
  postControllers.handleCreatePost
);

postRoute.get("/", postControllers.handleGetPost);

postRoute.get(
  "/search",
  validators.searchPostValidator,
  postControllers.handleSearchPost
);

postRoute.get("/detail/:postId", postControllers.handleGetDetailPost);

postRoute.post(
  "/addComment",
  upload.single("photo"),
  validators.addCommentValidator,
  postControllers.handleAddComment
);

export default postRoute;
