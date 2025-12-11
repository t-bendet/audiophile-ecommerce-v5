import {
  ProductCreateRequestSchema,
  ProductDeleteByIdRequestSchema,
  ProductGetAllRequestSchema,
  ProductGetByCategorySchema,
  ProductGetByIdRequestSchema,
  ProductGetByPathSchema,
  ProductGetBySlugSchema,
  ProductGetRelatedByIdRequestSchema,
  ProductUpdateByIdRequestSchema,
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

productRouter.post(
  "/",
  validateSchema(ProductCreateRequestSchema),
  productController.createProduct
);

productRouter
  .route("/:id")
  .patch(
    validateSchema(ProductUpdateByIdRequestSchema),
    productController.updateProduct
  )
  .delete(
    validateSchema(ProductDeleteByIdRequestSchema),
    productController.deleteProduct
  );

export default productRouter;
