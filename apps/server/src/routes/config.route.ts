import express from "express";
import * as configController from "../controllers/config.controller.js";
import * as authController from "../controllers/auth.controller.js";
import { validateSchema } from "../middlewares/validation.middleware.js";
import { CreateConfigSchema } from "@repo/domain";

const configRouter: express.Router = express.Router();

configRouter.get("/", configController.getConfig);

// * ADMIN ROUTES (restricted to admin roles)
configRouter.use(
  authController.authenticate,
  authController.checkAuthorization("ADMIN")
);

configRouter.post(
  "/",
  validateSchema(CreateConfigSchema),
  configController.createConfig
);

export default configRouter;
