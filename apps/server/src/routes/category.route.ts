import {
  CategoryCreateSchema,
  CategoryDeleteSchema,
  CategoryGetSchema,
  CategoryListSchema,
  CategoryUpdateSchema,
} from "@repo/domain";
import express from "express";
import * as categoryController from "../controllers/category.controller.js";
import { validateSchema } from "../middlewares/validation.middleware.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const categoryRouter: express.Router = express.Router();

categoryRouter.get(
  "/",
  validateSchema(CategoryListSchema),
  categoryController.getAllCategories
);

// * ADMIN ROUTES (restricted to admin roles)

categoryRouter.get(
  "/:id",
  validateSchema(CategoryGetSchema),
  categoryController.getCategory
);

categoryRouter.use(authenticate, authorize("ADMIN"));

categoryRouter.post(
  "/",
  validateSchema(CategoryCreateSchema),
  categoryController.createCategory
);

categoryRouter
  .route("/:id")
  .patch(
    validateSchema(CategoryUpdateSchema),
    categoryController.updateCategory
  )
  .delete(
    validateSchema(CategoryDeleteSchema),
    categoryController.deleteCategory
  );

export default categoryRouter;
