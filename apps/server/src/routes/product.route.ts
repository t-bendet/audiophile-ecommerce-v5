import express from "express";
import * as productController from "../controllers/product.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const productRouter: express.Router = express.Router();

productRouter.get("/", ...productController.getAllProducts);
productRouter.get("/featured", ...productController.getFeaturedProduct);
productRouter.get("/show-case", ...productController.getShowCaseProducts);

productRouter.get(
  "/related-products/:id",
  ...productController.getRelatedProducts,
);

productRouter.get("/:id", ...productController.getProductById);

productRouter.get("/slug/:slug", ...productController.getProductBySlug);

// * ADMIN ROUTES (restricted to admin roles)

productRouter.use(authenticate, authorize("ADMIN"));

productRouter.post("/", ...productController.createProduct);

productRouter
  .route("/:id")
  .patch(...productController.updateProduct)
  .delete(...productController.deleteProduct);

export default productRouter;
