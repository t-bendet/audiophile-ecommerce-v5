import express from "express";
import * as authController from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import {
  loginLimiter,
  passwordResetLimiter,
  signupLimiter,
} from "../utils/rateLimiters.js";

const authRouter: express.Router = express.Router();

// * AUTH ROUTES (open for all)

authRouter.post("/signup", signupLimiter, ...authController.signup);

authRouter.post("/login", loginLimiter, ...authController.login);

authRouter.post(
  "/forgot-password",
  passwordResetLimiter,
  ...authController.forgotPassword,
);

authRouter.get("/status", authController.getUserAuthStatus);

// * USER ROUTES (protected)

authRouter.use(authenticate);

authRouter.post("/logout", authController.logout);

authRouter.patch("/updateMyPassword", ...authController.updatePassword);

export default authRouter;
