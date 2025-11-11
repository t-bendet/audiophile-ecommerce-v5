import express from "express";
import * as authController from "../controllers/auth.controller";
import * as userController from "../controllers/user.controller";
import { validateSchema } from "../middlewares/validation.middleware";
import * as userSchema from "../schemas/user.schema";
import * as commonSchema from "../schemas/common.schema";

const userRouter: express.Router = express.Router();

// * USER ROUTES (protected)

userRouter.use(authController.authenticate);

userRouter.get("/me", userController.getMe, userController.getUser);

userRouter.patch(
  "/updateMe",
  validateSchema(userSchema.UpdateDetailsSchema),
  userController.updateMe
);

userRouter.delete("/deleteMe", userController.deleteMe);

// * ADMIN ROUTES (restricted to admin roles)

userRouter.use(authController.checkAuthorization("ADMIN"));

userRouter.route("/").get(userController.getAllUsers);

userRouter
  .route("/:id")
  .all(validateSchema(commonSchema.GetByIdSchema))
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

export default userRouter;
