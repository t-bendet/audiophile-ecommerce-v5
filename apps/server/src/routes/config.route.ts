import express from "express";
import * as configController from "../controllers/config.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const configRouter: express.Router = express.Router();

// * PUBLIC ROUTES

configRouter.get("/", ...configController.getConfig);

// * ADMIN ROUTES (restricted to admin roles)
configRouter.use(authenticate, authorize("ADMIN"));

configRouter.post("/", ...configController.createConfig);

configRouter.patch("/:id", ...configController.updateConfig);

configRouter.delete("/:id", ...configController.deleteConfig);

export default configRouter;
