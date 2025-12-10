import express from "express";
import * as authController from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validateSchema } from "../middlewares/validation.middleware.js";
import {
  AuthSignInUserSchema,
  AuthLoginUserSchema,
  AuthUpdateUserPasswordSchema,
} from "@repo/domain";

const authRouter: express.Router = express.Router();

// * AUTH ROUTES (open for all)

authRouter.post(
  "/signup",
  validateSchema(AuthSignInUserSchema),
  authController.signup
);

authRouter.post(
  "/login",
  validateSchema(AuthLoginUserSchema),
  authController.login
);

// authRouter.post('/forgotPassword', forgotPassword);
// authRouter.patch('/resetPassword/:token', resetPassword);

// * USER ROUTES (protected)

authRouter.use(authenticate);

authRouter.get("/logout", authController.logout);

authRouter.patch(
  "/updateMyPassword",
  validateSchema(AuthUpdateUserPasswordSchema),
  authController.updatePassword
);

export default authRouter;
