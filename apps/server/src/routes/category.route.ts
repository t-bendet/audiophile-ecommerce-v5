import {
  CategoryCreateRequestSchema,
  CategoryDeleteByIdRequestSchema,
  CategoryGetByIdRequestSchema,
  CategoryGetAllRequestSchema,
  CategoryUpdateByIdRequestSchema,
} from "@repo/domain";
import express from "express";
import * as categoryController from "../controllers/category.controller.js";
import { validateSchema } from "../middlewares/validation.middleware.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const categoryRouter: express.Router = express.Router();

categoryRouter.get(
  "/",
  validateSchema(CategoryGetAllRequestSchema),
  categoryController.getAllCategories
);

// * ADMIN ROUTES (restricted to admin roles)

categoryRouter.get(
  "/:id",
  validateSchema(CategoryGetByIdRequestSchema),
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
    validateSchema(CategoryUpdateByIdRequestSchema),
    categoryController.updateCategory
  )
  .delete(
    validateSchema(CategoryDeleteByIdRequestSchema),
    categoryController.deleteCategory
  );

export default categoryRouter;
