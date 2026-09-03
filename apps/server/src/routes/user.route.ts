import express from "express";
import * as userController from "../controllers/user.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const userRouter: express.Router = express.Router();

// * USER ROUTES (protected)

userRouter.use(authenticate);

userRouter.get("/me", ...userController.getMe);

userRouter.patch("/updateMe", ...userController.updateMe);

userRouter.delete("/deleteMe", ...userController.deleteMe);

// * ADMIN ROUTES (restricted to admin roles)

userRouter.use(authorize("ADMIN"));

userRouter.get("/", ...userController.getAllUsers);

userRouter.post("/", ...userController.createUser);

userRouter.get("/:id", ...userController.getUser);

userRouter.patch("/:id", ...userController.updateUser);

userRouter.delete("/:id", ...userController.deleteUser);

export default userRouter;
