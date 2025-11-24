import express from "express";
import * as authController from "../controllers/auth.controller.js";
import * as userController from "../controllers/user.controller.js";
import { validateSchema } from "../middlewares/validation.middleware.js";
import { UpdateUserDetailsSchema, GetByIdSchema } from "@repo/domain";

const userRouter: express.Router = express.Router();

// * USER ROUTES (protected)

userRouter.use(authController.authenticate);

userRouter.get("/me", userController.getMe, userController.getUser);

userRouter.patch(
  "/updateMe",
  validateSchema(UpdateUserDetailsSchema),
  userController.updateMe
);

userRouter.delete("/deleteMe", userController.deleteMe);

// * ADMIN ROUTES (restricted to admin roles)

userRouter.use(authController.checkAuthorization("ADMIN"));

userRouter.route("/").get(userController.getAllUsers);

userRouter
  .route("/:id")
  .all(validateSchema(GetByIdSchema))
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

export default userRouter;
