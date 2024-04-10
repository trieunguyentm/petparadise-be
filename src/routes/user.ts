import * as userControllers from "../controllers/user-controllers";
import * as validators from "../validators/user-validators";
import { Router } from "express";
import { authenticate, upload } from "../validators/middleware";

const userRoute = Router();

userRoute.use(authenticate);

userRoute.get("/", userControllers.handleGetUser);

userRoute.post(
  "/change-password",
  validators.changePasswordValidator,
  userControllers.handleChangePassword
);

userRoute.post("/update", upload.single("photo"), userControllers.handleUpdate);

export default userRoute;
