import { Router } from "express";
import authRoute from "./auth";
import userRoute from "./user";
import postRoute from "./post";

const router = Router();
router.use("/auth", authRoute);
router.use("/user", userRoute);
router.use("/post", postRoute);

export default router;
