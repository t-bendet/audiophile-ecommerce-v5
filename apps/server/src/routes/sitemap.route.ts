import express from "express";
import * as sitemapController from "../controllers/sitemap.controller.js";

const sitemapRouter: express.Router = express.Router();

sitemapRouter.get("/", sitemapController.getSitemap);

export default sitemapRouter;
