import express from "express";
import * as categoryController from "../controllers/category.controller.js";
import * as productController from "../controllers/product.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const categoryRouter: express.Router = express.Router();

categoryRouter.get("/", ...categoryController.getAllCategories);

categoryRouter.get(
  "/:category/products",
  ...productController.getProductsByCategoryName,
);

categoryRouter.get("/:id", ...categoryController.getCategoryById);

// * ADMIN ROUTES (restricted to admin roles)

categoryRouter.use(authenticate, authorize("ADMIN"));

categoryRouter.post("/", ...categoryController.createCategory);

categoryRouter
  .route("/:id")
  .patch(...categoryController.updateCategory)
  .delete(...categoryController.deleteCategory);

export default categoryRouter;
