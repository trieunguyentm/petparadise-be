import { Router } from "express";
import * as validators from "../validators/auth-validators";
import * as authControllers from "../controllers/auth-controllers";

const authRoute = Router();

authRoute.get("/", authControllers.handleAuth);

authRoute.post(
  "/verify",
  validators.verifyValidator,
  authControllers.handleVerify
);

authRoute.post(
  "/register",
  validators.registerValidator,
  authControllers.handleRegister
);

authRoute.get("/resend-verify-otp", authControllers.handleResendVerifyOTP);

authRoute.post(
  "/verify-otp",
  validators.verifyOTPValidator,
  authControllers.handleVerifyOTP
);

authRoute.post(
  "/recovery-password",
  validators.recoveryPasswordValidator,
  authControllers.handleRecoveryPassword
);

authRoute.get(
  "/resend-verify-otp-recovery",
  authControllers.handleResendVerifyOTPRecovery
);

authRoute.post(
  "/verify-otp-recovery",
  validators.verifyOTPValidator,
  authControllers.handleVerifyOTPRecovery
);

authRoute.post(
  "/confirm-password",
  validators.confirmPasswordValidator,
  authControllers.handleConfirmPassword
);

authRoute.post(
  "/login",
  validators.loginValidator,
  authControllers.handleLogin
);

export default authRoute;
