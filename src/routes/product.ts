import * as validator from "../validators/product-validators";
import * as productControllers from "../controllers/product-controllers";
import { Router } from "express";
import { authenticate, upload } from "../validators/middleware";

const productRoute = Router();

productRoute.use(authenticate);

productRoute.post(
  "/create",
  upload.array("images"),
  validator.createProductValidator,
  productControllers.handleCreateProduct
);

export default productRoute;
