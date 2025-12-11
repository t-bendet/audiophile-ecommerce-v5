import {
  CategoryCreateRequestSchema,
  CategoryDeleteByIdRequestSchema,
  CategoryGetAllRequestSchema,
  CategoryGetByIdRequestSchema,
  CategoryUpdateByIdRequestSchema,
  ProductGetByCategorySchema,
} from "@repo/domain";
import express from "express";
import * as categoryController from "../controllers/category.controller.js";
import * as productController from "../controllers/product.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { validateSchema } from "../middlewares/validation.middleware.js";

const categoryRouter: express.Router = express.Router();

categoryRouter.get(
  "/",
  validateSchema(CategoryGetAllRequestSchema),
  categoryController.getAllCategories
);

categoryRouter.get(
  "/:category/products",
  validateSchema(ProductGetByCategorySchema),
  productController.getProductsByCategoryName
);

categoryRouter.get(
  "/:id",
  validateSchema(CategoryGetByIdRequestSchema),
  categoryController.getCategoryById
);

// * ADMIN ROUTES (restricted to admin roles)

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
