import {
  ConfigCreateRequestSchema,
  ConfigDeleteByIdRequestSchema,
  ConfigGetUniqueRequestSchema,
  ConfigUpdateByIdRequestSchema,
} from "@repo/domain";
import express from "express";
import * as configController from "../controllers/config.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { validateSchema } from "../middlewares/validation.middleware.js";

const configRouter: express.Router = express.Router();

// * PUBLIC ROUTES

configRouter.get(
  "/",
  validateSchema(ConfigGetUniqueRequestSchema),
  configController.getConfig
);

// * ADMIN ROUTES (restricted to admin roles)
configRouter.use(authenticate, authorize("ADMIN"));

configRouter.post(
  "/",
  validateSchema(ConfigCreateRequestSchema),
  configController.createConfig
);

configRouter.patch(
  "/:id",
  validateSchema(ConfigUpdateByIdRequestSchema),
  configController.updateConfig
);

configRouter.delete(
  "/:id",
  validateSchema(ConfigDeleteByIdRequestSchema),
  configController.deleteConfig
);

export default configRouter;
