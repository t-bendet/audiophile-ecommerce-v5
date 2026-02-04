import {
  CreateOrderRequestSchema,
  GetOrderRequestSchema,
  ListOrdersRequestSchema,
  UpdateOrderStatusRequestSchema,
} from "@repo/domain";
import express from "express";
import * as orderController from "../controllers/order.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { validateSchema } from "../middlewares/validation.middleware.js";

const orderRouter: express.Router = express.Router();

// All order routes require authentication
orderRouter.use(authenticate);

// Create order from cart
orderRouter.post(
  "/",
  validateSchema(CreateOrderRequestSchema),
  orderController.createOrder
);

// List user's orders
orderRouter.get(
  "/",
  validateSchema(ListOrdersRequestSchema),
  orderController.listOrders
);

// Get specific order
orderRouter.get(
  "/:orderId",
  validateSchema(GetOrderRequestSchema),
  orderController.getOrder
);

// * ADMIN ROUTES (restricted to admin roles)

orderRouter.use(authorize("ADMIN"));

// Update order status (admin only)
orderRouter.patch(
  "/:orderId/status",
  validateSchema(UpdateOrderStatusRequestSchema),
  orderController.updateOrderStatus
);

export default orderRouter;
