import express from "express";
import * as orderController from "../controllers/order.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { createOrderLimiter } from "../utils/rateLimiters.js";

const orderRouter: express.Router = express.Router();

// All order routes require authentication
orderRouter.use(authenticate);

// Create order from cart
orderRouter.post("/", createOrderLimiter, ...orderController.createOrder);

// List user's orders
orderRouter.get("/", ...orderController.listOrders);

// Get specific order
orderRouter.get("/:orderId", ...orderController.getOrder);

// * ADMIN ROUTES (restricted to admin roles)

orderRouter.use(authorize("ADMIN"));

// Update order status (admin only)
orderRouter.patch("/:orderId/status", ...orderController.updateOrderStatus);

export default orderRouter;
