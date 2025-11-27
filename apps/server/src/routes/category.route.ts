import {
  categoryCreateSchema,
  categoryIdParamsSchema,
  categoryQuerySchema,
  categoryUpdateSchema,
} from "@repo/domain";
import express from "express";
import * as categoryController from "../controllers/category.controller.js";
import { validateSchema } from "../middlewares/validation.middleware.js";

const categoryRouter: express.Router = express.Router();

categoryRouter
  .route("/")
  .get(validateSchema(categoryQuerySchema), categoryController.getAllCategories)
  .post(
    validateSchema(categoryCreateSchema),
    categoryController.createCategory
  );

categoryRouter
  .route("/:id")
  .get(validateSchema(categoryIdParamsSchema), categoryController.getCategory)
  .patch(
    validateSchema(categoryUpdateSchema),
    categoryController.updateCategory
  )
  .delete(
    validateSchema(categoryIdParamsSchema),
    categoryController.deleteCategory
  );

export default categoryRouter;
