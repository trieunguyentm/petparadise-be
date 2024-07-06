import * as validators from "../validators/admin-validators";
import * as adminControllers from "../controllers/admin-controllers";
import { Router } from "express";
import { adminAuthentiation } from "../validators/middleware";

const adminRoute = Router();

adminRoute.use(adminAuthentiation);

adminRoute.post(
  "/ban-user",
  validators.banUserValidator,
  adminControllers.handleBanUser
);

adminRoute.delete(
  "/delete-post/:postId",
  validators.deletePostValidator,
  adminControllers.handleDeletePost
);

export default adminRoute;
