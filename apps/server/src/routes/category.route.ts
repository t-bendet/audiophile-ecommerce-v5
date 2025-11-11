import express from "express";
import * as categoryController from "../controllers/category.controller";

const categoryRouter = express.Router();

categoryRouter.route("/").get(categoryController.getAllCategories);

export default categoryRouter;
