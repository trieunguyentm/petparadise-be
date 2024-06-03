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

productRoute.get(
  "/",
  validator.getProductValidator,
  productControllers.handleGetProduct
);

productRoute.get(
  "/:productId",
  validator.getProductByIdValidator,
  productControllers.handleGetProductById
);

productRoute.post(
  "/add-cart",
  validator.addToCartValidator,
  productControllers.handleAddToCart
);

productRoute.put(
  "/:productId/edit",
  upload.array("images"),
  validator.editProductValidator,
  productControllers.handleEditProduct
);

export default productRoute;
