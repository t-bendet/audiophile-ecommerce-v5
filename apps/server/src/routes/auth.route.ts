import express from "express";
import * as authController from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validateSchema } from "../middlewares/validation.middleware.js";
import {
  AuthSignUpRequestSchema,
  AuthLoginRequestSchema,
  AuthUpdatePasswordRequestSchema,
} from "@repo/domain";

const authRouter: express.Router = express.Router();

// * AUTH ROUTES (open for all)

authRouter.post(
  "/signup",
  validateSchema(AuthSignUpRequestSchema),
  authController.signup
);

authRouter.post(
  "/login",
  validateSchema(AuthLoginRequestSchema),
  authController.login
);

// authRouter.post('/forgotPassword', forgotPassword);
// authRouter.patch('/resetPassword/:token', resetPassword);

// * USER ROUTES (protected)

authRouter.use(authenticate);

authRouter.get("/logout", authController.logout);

authRouter.patch(
  "/updateMyPassword",
  validateSchema(AuthUpdatePasswordRequestSchema),
  authController.updatePassword
);

export default authRouter;
