import {
  ProductGetAllRequestSchema,
  ProductGetByCategorySchema,
  ProductGetByIdRequestSchema,
  ProductGetByPathSchema,
  ProductGetBySlugSchema,
  ProductGetRelatedByIdRequestSchema,
} from "@repo/domain";
import express from "express";
import * as productController from "../controllers/product.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { validateSchema } from "../middlewares/validation.middleware.js";

const productRouter: express.Router = express.Router();

productRouter.get(
  "/",
  validateSchema(ProductGetAllRequestSchema),
  productController.getAllProducts
);
productRouter.get(
  "/featured",
  validateSchema(ProductGetByPathSchema),
  productController.getFeaturedProduct
);
productRouter.get(
  "/show-case",
  validateSchema(ProductGetByPathSchema),
  productController.getShowCaseProducts
);

productRouter.get(
  "/related-products/:id",
  validateSchema(ProductGetRelatedByIdRequestSchema),
  productController.getRelatedProducts
);

//  TODO should be in category route
productRouter.get(
  "/category/:category",
  validateSchema(ProductGetByCategorySchema),
  productController.getProductsByCategoryName
);

productRouter.get(
  "/:id",
  validateSchema(ProductGetByIdRequestSchema),
  productController.getProductById
);

productRouter.get(
  "/slug/:slug",
  validateSchema(ProductGetBySlugSchema),
  productController.getProductBySlug
);

// * ADMIN ROUTES (restricted to admin roles)

productRouter.use(authenticate, authorize("ADMIN"));

// TODO add routes for creating, updating, deleting products (admin only)

export default productRouter;
