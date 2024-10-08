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
  "/purchased-order",
  productControllers.handleGetPurchasedOrder
);

productRoute.get("/my-order", productControllers.handleGetMyOrder);

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

productRoute.delete(
  "/delete-cart",
  validator.deleteCartValidator,
  productControllers.handleDeleteCart
);

productRoute.put(
  "/:productId/edit",
  upload.array("images"),
  validator.editProductValidator,
  productControllers.handleEditProduct
);

productRoute.delete(
  "/:productId",
  validator.deleteProductValidator,
  productControllers.handleDeleteProduct
);

productRoute.put(
  "/:orderId/set-order",
  validator.setOrderValidator,
  productControllers.handleSetOrder
);

productRoute.post(
  "/:orderId/confirm-order",
  validator.confirmOrderValidator,
  productControllers.handleConfirmOrder
);

export default productRoute;
