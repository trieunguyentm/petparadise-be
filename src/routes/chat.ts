import * as validators from "../validators/chat-validators";
import * as chatControllers from "../controllers/chat-controllers";
import { Request, Response, Router } from "express";
import { authenticate, upload } from "../validators/middleware";

const chatRoute = Router();

chatRoute.use(authenticate);

chatRoute.post(
  "/",
  upload.single("groupPhoto"),
  validators.createChatValidator,
  chatControllers.handleCreateChat
);

export default chatRoute;
