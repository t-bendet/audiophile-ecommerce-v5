import { UpdateUserDetailsSchema } from "@repo/domain";
import express from "express";
import * as userController from "../controllers/user.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { validateSchema } from "../middlewares/validation.middleware.js";

const userRouter: express.Router = express.Router();

// * USER ROUTES (protected)

userRouter.use(authenticate);

userRouter.get("/me", userController.getMe, userController.getUser);

userRouter.patch(
  "/updateMe",
  validateSchema(UpdateUserDetailsSchema),
  userController.updateMe
);

userRouter.delete("/deleteMe", userController.deleteMe);

// * ADMIN ROUTES (restricted to admin roles)

userRouter.use(authorize("ADMIN"));

userRouter.route("/").get(userController.getAllUsers);

userRouter
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

export default userRouter;
