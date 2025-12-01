import {
  CategoryCreateRequestSchema,
  CategoryDeleteRequestSchema,
  CategoryGetRequestSchema,
  CategoryListRequestSchema,
  CategoryUpdateRequestSchema,
} from "@repo/domain";
import express from "express";
import * as categoryController from "../controllers/category.controller.js";
import { validateSchema } from "../middlewares/validation.middleware.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const categoryRouter: express.Router = express.Router();

categoryRouter.get(
  "/",
  validateSchema(CategoryListRequestSchema),
  categoryController.getAllCategories
);

// * ADMIN ROUTES (restricted to admin roles)

categoryRouter.get(
  "/:id",
  validateSchema(CategoryGetRequestSchema),
  categoryController.getCategory
);

categoryRouter.use(authenticate, authorize("ADMIN"));

categoryRouter.post(
  "/",
  validateSchema(CategoryCreateRequestSchema),
  categoryController.createCategory
);

categoryRouter
  .route("/:id")
  .patch(
    validateSchema(CategoryUpdateRequestSchema),
    categoryController.updateCategory
  )
  .delete(
    validateSchema(CategoryDeleteRequestSchema),
    categoryController.deleteCategory
  );

export default categoryRouter;
