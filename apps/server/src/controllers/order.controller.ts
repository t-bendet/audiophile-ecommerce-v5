import {
  createListResponse,
  createSingleItemResponse,
  CreateOrderRequestSchema,
  GetOrderRequestSchema,
  ListOrdersRequestSchema,
  UpdateOrderStatusRequestSchema,
} from "@repo/domain";
import { RequestHandler } from "express";
import { orderService } from "../services/order.service.js";
import { ValidatedRequest } from "../types/validated-request.js";
import catchAsync from "../utils/catchAsync.js";

/**
 * Create order from cart
 */
export const createOrder: RequestHandler = catchAsync<
  ValidatedRequest<typeof CreateOrderRequestSchema>
>(async (req, res) => {
  const userId = req.user!.id; // User is set by auth middleware
  const orderInput = req.verified.body;

  const dto = await orderService.createOrder(userId, orderInput);
  res.status(201).json(createSingleItemResponse(dto));
});

/**
 * Get order by ID
 */
export const getOrder: RequestHandler = catchAsync<
  ValidatedRequest<typeof GetOrderRequestSchema>
>(async (req, res) => {
  const userId = req.user!.id;
  const { orderId } = req.verified.params;

  const dto = await orderService.getOrderById(userId, orderId);
  res.status(200).json(createSingleItemResponse(dto));
});

/**
 * List user's orders
 */
export const listOrders: RequestHandler = catchAsync<
  ValidatedRequest<typeof ListOrdersRequestSchema>
>(async (req, res) => {
  const userId = req.user!.id;
  const query = req.verified.query;

  const result = await orderService.listUserOrders(userId, query);
  res.status(200).json(createListResponse(result.data, result.meta));
});

/**
 * Update order status (admin only)
 */
export const updateOrderStatus: RequestHandler = catchAsync<
  ValidatedRequest<typeof UpdateOrderStatusRequestSchema>
>(async (req, res) => {
  const { orderId } = req.verified.params;
  const { status } = req.verified.body;

  const dto = await orderService.updateOrderStatus(orderId, status);
  res.status(200).json(createSingleItemResponse(dto));
});
