import {
  GetProductBySlugSchema,
  GetProductsByCategorySchema,
} from "@repo/domain";
import express from "express";
import * as productController from "../controllers/product.controller.js";
import { validateSchema } from "../middlewares/validation.middleware.js";

const productRouter: express.Router = express.Router();

productRouter.route("/").get(productController.getAllProducts);
productRouter.route("/featured").get(productController.getFeaturedProduct);
productRouter.route("/show-case").get(productController.getShowCaseProducts);

productRouter
  .route("/related-products/:id")
  .get(productController.getRelatedProducts);

//  TODO should be in category route
productRouter
  .route("/category/:category")
  .get(
    validateSchema(GetProductsByCategorySchema),
    productController.getProductsByCategoryName
  );

productRouter.route("/:id").get(productController.getProductById);

productRouter
  .route("/slug/:slug")
  .get(
    validateSchema(GetProductBySlugSchema),
    productController.getProductBySlug
  );

export default productRouter;
