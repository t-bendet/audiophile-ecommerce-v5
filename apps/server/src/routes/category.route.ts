import express from "express";
import * as categoryController from "../controllers/category.controller.js";

const categoryRouter: express.Router = express.Router();

categoryRouter.route("/").get(categoryController.getAllCategories);

export default categoryRouter;
