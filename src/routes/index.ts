import { Router } from "express";
import authRoute from "./auth";
import userRoute from "./user";
import postRoute from "./post";
import chatRoute from "./chat";
import messageRoute from "./message";
import lostPetRoute from "./lostpet";
import petAdoptionRoute from "./petadoption";

const router = Router();
router.use("/auth", authRoute);
router.use("/user", userRoute);
router.use("/post", postRoute);
router.use("/chat", chatRoute);
router.use("/message", messageRoute);
router.use("/lost-pet", lostPetRoute);
router.use("/pet-adoption", petAdoptionRoute);

export default router;
