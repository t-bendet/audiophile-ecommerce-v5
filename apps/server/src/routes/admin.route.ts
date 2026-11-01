import express from "express";
import * as orderController from "../controllers/order.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

/**
 * Admin reads that cross users. The order router owns `/orders/:orderId` for
 * the signed-in shopper, so the admin's view of any order lives here; admin
 * writes stay in the resource routers' admin sections.
 */
const adminRouter: express.Router = express.Router();

adminRouter.use(authenticate, authorize("ADMIN"));

adminRouter.get("/orders", ...orderController.listAllOrders);

adminRouter.get("/orders/:orderId", ...orderController.getAnyOrder);

export default adminRouter;
