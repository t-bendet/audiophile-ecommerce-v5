import express from "express";
import * as authController from "../controllers/auth.controller.js";
import { validateSchema } from "../middlewares/validation.middleware.js";
import {
  CreateUserSchema,
  LoginUserSchema,
  UpdateUserPasswordSchema,
} from "@repo/domain";

const authRouter: express.Router = express.Router();

// * AUTH ROUTES (open for all)

authRouter.post(
  "/signup",
  validateSchema(CreateUserSchema),
  authController.signup
);

authRouter.post(
  "/login",
  validateSchema(LoginUserSchema),
  authController.login
);

// authRouter.post('/forgotPassword', forgotPassword);
// authRouter.patch('/resetPassword/:token', resetPassword);

// * USER ROUTES (protected)

authRouter.use(authController.authenticate);

authRouter.get("/logout", authController.logout);

authRouter.patch(
  "/updateMyPassword",
  validateSchema(UpdateUserPasswordSchema),
  authController.updatePassword
);

export default authRouter;
