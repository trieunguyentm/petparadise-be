import { Router } from "express";
import authRoute from "./auth";
import userRoute from "./user";
import postRoute from "./post";
import chatRoute from "./chat";
import messageRoute from "./message";
import lostPetRoute from "./lostpet";
import petAdoptionRoute from "./petadoption";
import adoptionRequestRoute from "./adoptionrequest";
import productRoute from "./product";
import paymentRoute from "./payment";

const router = Router();
router.use("/auth", authRoute);
router.use("/user", userRoute);
router.use("/post", postRoute);
router.use("/chat", chatRoute);
router.use("/message", messageRoute);
router.use("/lost-pet", lostPetRoute);
router.use("/pet-adoption", petAdoptionRoute);
router.use("/adoption-request", adoptionRequestRoute);
router.use("/product", productRoute);
router.use("/payment", paymentRoute);

export default router;
