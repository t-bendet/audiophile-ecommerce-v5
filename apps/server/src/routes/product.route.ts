import {
  ProductGetBySlugSchema,
  ProductGetByCategorySchema,
} from "@repo/domain";
import express from "express";
import * as productController from "../controllers/product.controller.js";
import { validateSchema } from "../middlewares/validation.middleware.js";

const productRouter: express.Router = express.Router();

productRouter.get("/", productController.getAllProducts);
productRouter.get("/featured", productController.getFeaturedProduct);
productRouter.get("/show-case", productController.getShowCaseProducts);

productRouter.get(
  "/related-products/:id",
  productController.getRelatedProducts
);

//  TODO should be in category route
productRouter
  .route("/category/:category")
  .get(
    validateSchema(ProductGetByCategorySchema),
    productController.getProductsByCategoryName
  );

productRouter.get("/:id", productController.getProductById);

productRouter.get(
  "/slug/:slug",
  validateSchema(ProductGetBySlugSchema),
  productController.getProductBySlug
);

export default productRouter;
