import express from "express";
import * as productController from "../controllers/product.controller.js";
import { validateSchema } from "../middlewares/validation.middleware.js";
import * as commonSchema from "../schemas/common.schema.js";
import * as productSchema from "../schemas/product.schema.js";

const productRouter: express.Router = express.Router();

productRouter.param("id", validateSchema(commonSchema.GetByIdSchema));

productRouter.route("/").get(productController.getAllProducts);
productRouter.route("/featured").get(productController.getFeaturedProduct);
productRouter.route("/show-case").get(productController.getShowCaseProducts);

productRouter
  .route("/related-products/:id")
  .get(productController.getRelatedProducts);

productRouter
  .route("/category/:category")
  .get(
    validateSchema(productSchema.ReadProductsByCategorySchema),
    productController.getProductsByCategoryName
  );

productRouter.route("/:id").get(productController.getProductById);

productRouter
  .route("/slug/:slug")
  .get(
    validateSchema(productSchema.ReadProductBySlugSchema),
    productController.getProductBySlug
  );

export default productRouter;
