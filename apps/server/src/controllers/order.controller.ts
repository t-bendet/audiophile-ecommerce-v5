import {
  createListResponse,
  createSingleItemResponse,
  CreateOrderRequestSchema,
  GetOrderRequestSchema,
  ListOrdersRequestSchema,
  UpdateOrderStatusRequestSchema,
} from "@repo/domain";
import { orderService } from "../services/order.service.js";
import { defineHandler, ValidatedHandler } from "../utils/define-handler.js";

/**
 * Create order from cart
 */
export const createOrder: ValidatedHandler = defineHandler(
  CreateOrderRequestSchema,
  async (req, res) => {
    const userId = req.user!.id; // User is set by auth middleware
    const orderInput = req.verified.body;

    const dto = await orderService.createOrder(userId, orderInput);
    res.status(201).json(createSingleItemResponse(dto));
  },
);

/**
 * Get order by ID
 */
export const getOrder: ValidatedHandler = defineHandler(
  GetOrderRequestSchema,
  async (req, res) => {
    const userId = req.user!.id;
    const { orderId } = req.verified.params;

    const dto = await orderService.getOrderById(userId, orderId);
    res.status(200).json(createSingleItemResponse(dto));
  },
);

/**
 * List user's orders
 */
export const listOrders: ValidatedHandler = defineHandler(
  ListOrdersRequestSchema,
  async (req, res) => {
    const userId = req.user!.id;
    const query = req.verified.query;

    const result = await orderService.listUserOrders(userId, query);
    res.status(200).json(createListResponse(result.data, result.meta));
  },
);

/**
 * Update order status (admin only)
 */
export const updateOrderStatus: ValidatedHandler = defineHandler(
  UpdateOrderStatusRequestSchema,
  async (req, res) => {
    const { orderId } = req.verified.params;
    const { status } = req.verified.body;

    const dto = await orderService.updateOrderStatus(orderId, status);
    res.status(200).json(createSingleItemResponse(dto));
  },
);
