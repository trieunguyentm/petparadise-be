import { Router } from "express";
import * as validators from "../validators/auth-validators";
import * as authControllers from "../controllers/auth-controllers";

const authRoute = Router();

authRoute.post(
  "/register",
  validators.registerValidator,
  authControllers.handleRegister
);

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
