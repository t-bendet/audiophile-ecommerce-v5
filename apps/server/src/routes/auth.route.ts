import express from "express";
import * as authController from "../controllers/auth.controller";
import { validateSchema } from "../middlewares/validation.middleware";
import * as userSchema from "../schemas/user.schema";

const authRouter = express.Router();

// * AUTH ROUTES (open for all)

authRouter.post(
  "/signup",
  validateSchema(userSchema.CreateSchema),
  authController.signup
);

authRouter.post(
  "/login",
  validateSchema(userSchema.ReadSchema),
  authController.login
);

// authRouter.post('/forgotPassword', forgotPassword);
// authRouter.patch('/resetPassword/:token', resetPassword);

// * USER ROUTES (protected)

authRouter.use(authController.authenticate);

authRouter.get("/logout", authController.logout);

authRouter.patch(
  "/updateMyPassword",
  validateSchema(userSchema.UpdatePasswordSchema),
  authController.updatePassword
);

export default authRouter;
