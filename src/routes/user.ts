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

userRoute.put(
  "/update",
  upload.single("photo"),
  validators.updateUserValidator,
  userControllers.handleUpdate
);

userRoute.post(
  "/like",
  validators.likePostValidator,
  userControllers.handleLikePost
);

userRoute.post(
  "/save",
  validators.savePostValidator,
  userControllers.handleSavePost
);

userRoute.get("/other", userControllers.handleGetOtherUser);

userRoute.get("/other/:search", userControllers.handleGetOtherUserBySearch);

userRoute.post(
  "/follow",
  validators.followValidator,
  userControllers.handleFollow
);

userRoute.get("/notification", userControllers.handleGetNotification);

userRoute.get("/logout", userControllers.handleLogout);

userRoute.get("/logout-all-device", userControllers.handleLogoutAllDevice);

userRoute.get(
  "/search",
  validators.searchValidator,
  userControllers.handleSearchUser
);

export default userRoute;
