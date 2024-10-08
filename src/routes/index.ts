import { Router } from "express";
import authRoute from "./auth";
import userRoute from "./user";
import postRoute from "./post";
import chatRoute from "./chat";
import messageRoute from "./message";
import lostPetRoute from "./lostpet";
import petAdoptionRoute from "./petadoption";
import adoptionRequestRoute from "./adoption-request";
import productRoute from "./product";
import paymentRoute from "./payment";
import refundRequestRoute from "./refund-request";
import adminRoute from "./admin";

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
router.use("/refund-request", refundRequestRoute);
router.use("/admin", adminRoute);

export default router;
