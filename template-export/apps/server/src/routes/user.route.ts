import {
  UserCreateRequestSchema,
  UserDeleteByIdRequestSchema,
  UserDeleteMeRequestSchema,
  UserGetAllRequestSchema,
  UserGetByIdRequestSchema,
  UserGetMeRequestSchema,
  UserUpdateByIdRequestSchema,
  UserUpdateMeRequestSchema,
} from "@repo/domain";
import express from "express";
import * as userController from "../controllers/user.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { validateSchema } from "../middlewares/validation.middleware.js";

const userRouter: express.Router = express.Router();

// * USER ROUTES (protected)

userRouter.use(authenticate);

userRouter.get(
  "/me",
  validateSchema(UserGetMeRequestSchema),
  userController.getMe,
  userController.getUser
);

userRouter.patch(
  "/updateMe",
  validateSchema(UserUpdateMeRequestSchema),
  userController.updateMe
);

userRouter.delete(
  "/deleteMe",
  validateSchema(UserDeleteMeRequestSchema),
  userController.deleteMe
);

// * ADMIN ROUTES (restricted to admin roles)

userRouter.use(authorize("ADMIN"));

userRouter.get(
  "/",
  validateSchema(UserGetAllRequestSchema),
  userController.getAllUsers
);

userRouter.post(
  "/",
  validateSchema(UserCreateRequestSchema),
  userController.createUser
);

userRouter.get(
  "/:id",
  validateSchema(UserGetByIdRequestSchema),
  userController.getUser
);

userRouter.patch(
  "/:id",
  validateSchema(UserUpdateByIdRequestSchema),
  userController.updateUser
);

userRouter.delete(
  "/:id",
  validateSchema(UserDeleteByIdRequestSchema),
  userController.deleteUser
);

export default userRouter;
