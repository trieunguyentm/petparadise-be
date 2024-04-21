import * as validators from "../validators/message-validators";
import * as messageControllers from "../controllers/message-controllers";
import { Router } from "express";
import { authenticate, upload } from "../validators/middleware";

const messageRoute = Router();

messageRoute.use(authenticate);

messageRoute.post(
  "/",
  upload.single("photo"),
  validators.createMessageValidator,
  messageControllers.handleCreateMessage
);

export default messageRoute;
