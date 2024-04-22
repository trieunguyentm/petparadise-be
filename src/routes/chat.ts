import * as validators from "../validators/chat-validators";
import * as chatControllers from "../controllers/chat-controllers";
import { Router } from "express";
import { authenticate, upload } from "../validators/middleware";

const chatRoute = Router();

chatRoute.use(authenticate);

chatRoute.post(
  "/",
  upload.single("groupPhoto"),
  validators.createChatValidator,
  chatControllers.handleCreateChat
);

chatRoute.get("/", chatControllers.handleGetChat);

chatRoute.get("/:chatId", chatControllers.handleGetDetailChat);

chatRoute.post("/:chatId", chatControllers.handleSeen);

chatRoute.get("/:chatId/messages", chatControllers.handleGetMessageChat);

export default chatRoute;
