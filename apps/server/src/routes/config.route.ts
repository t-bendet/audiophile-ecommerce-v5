import express from "express";
import * as configController from "../controllers/config.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { validateSchema } from "../middlewares/validation.middleware.js";
import { CreateConfigSchema } from "@repo/domain";

const configRouter: express.Router = express.Router();

configRouter.get("/", configController.getConfig);

// * ADMIN ROUTES (restricted to admin roles)
configRouter.use(authenticate, authorize("ADMIN"));

configRouter.post(
  "/",
  validateSchema(CreateConfigSchema),
  configController.createConfig
);

export default configRouter;
