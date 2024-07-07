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
  validators.deleteReportValidator,
  adminControllers.handleDeletePost
);

adminRoute.get("/get-report", adminControllers.handleGetReport);

adminRoute.put(
  "/update-report",
  validators.updateReportValidator,
  adminControllers.handleUpdateReport
);

adminRoute.get(
  "/get-draw-money-histories",
  adminControllers.handleDrawMoneyHistories
);

adminRoute.put(
  "/update-draw-money-history",
  validators.updateDrawMoneyHistoryValidator,
  adminControllers.handleUpdateDrawMoneyHistory
);

adminRoute.delete(
  "/delete-product/:productId",
  validators.deleteProductvalidator,
  adminControllers.handleDeleteProductByAdmin
);

export default adminRoute;
