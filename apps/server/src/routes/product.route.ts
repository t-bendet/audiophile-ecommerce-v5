import express from "express";
import * as productController from "../controllers/product.controller";
import { validateSchema } from "../middlewares/validation.middleware";
import * as commonSchema from "../schemas/common.schema";
import * as productSchema from "../schemas/product.schema";

const productRouter = express.Router();

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
    validateSchema(productSchema.ReadByNameSchema),
    productController.getProductsByCategoryName
  );

productRouter.route("/:id").get(productController.getProductById);

productRouter
  .route("/slug/:slug")
  .get(
    validateSchema(productSchema.ReadBySlugSchema),
    productController.getProductBySlug
  );

export default productRouter;
