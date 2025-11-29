import {
  categoryCreateSchema,
  categoryIdParamsSchema,
  categoryQuerySchema,
  categoryUpdateSchema,
} from "@repo/domain";
import express from "express";
import * as categoryController from "../controllers/category.controller.js";
import { validateSchema } from "../middlewares/validation.middleware.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const categoryRouter: express.Router = express.Router();

categoryRouter.get(
  "/",
  validateSchema(categoryQuerySchema),
  categoryController.getAllCategories
);

// * ADMIN ROUTES (restricted to admin roles)

categoryRouter.get(
  "/:id",
  validateSchema(categoryIdParamsSchema),
  categoryController.getCategory
);

categoryRouter.use(authenticate, authorize("ADMIN"));

categoryRouter.post(
  "/",
  validateSchema(categoryCreateSchema),
  categoryController.createCategory
);

categoryRouter
  .route("/:id")
  .patch(
    validateSchema(categoryUpdateSchema),
    categoryController.updateCategory
  )
  .delete(
    validateSchema(categoryIdParamsSchema),
    categoryController.deleteCategory
  );

export default categoryRouter;
