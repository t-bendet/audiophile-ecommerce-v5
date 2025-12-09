import {
  ProductGetBySlugSchema,
  ProductGetByCategorySchema,
  ProductGetAllRequestSchema,
  ProductGetByPathSchema,
  ProductGetRelatedByIdRequestSchema,
  ProductGetByIdRequestSchema,
} from "@repo/domain";
import express from "express";
import * as productController from "../controllers/product.controller.js";
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

export default productRouter;
