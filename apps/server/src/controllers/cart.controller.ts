import {
  createEmptyResponse,
  createSingleItemResponse,
} from "@repo/domain";
import { RequestHandler } from "express";
import { cartService } from "../services/cart.service.js";
import catchAsync from "../utils/catchAsync.js";

/**
 * Get current user's cart
 */
export const getCart: RequestHandler = catchAsync(async (req, res) => {
  const userId = req.user!.id; // User is set by auth middleware
  const dto = await cartService.getOrCreateCart(userId);
  res.status(200).json(createSingleItemResponse(dto));
});

/**
 * Add item to cart
 */
export const addToCart: RequestHandler = catchAsync(async (req, res) => {
  const userId = req.user!.id;
  const { productId, quantity } = req.verified?.body;
  
  const dto = await cartService.addToCart(userId, productId, quantity);
  res.status(200).json(createSingleItemResponse(dto));
});

/**
 * Update cart item quantity
 */
export const updateCartItem: RequestHandler = catchAsync(async (req, res) => {
  const userId = req.user!.id;
  const { cartItemId } = req.verified?.params;
  const { quantity } = req.verified?.body;
  
  const dto = await cartService.updateCartItem(userId, cartItemId, quantity);
  res.status(200).json(createSingleItemResponse(dto));
});

/**
 * Remove item from cart
 */
export const removeFromCart: RequestHandler = catchAsync(async (req, res) => {
  const userId = req.user!.id;
  const { cartItemId } = req.verified?.params;
  
  const dto = await cartService.removeFromCart(userId, cartItemId);
  res.status(200).json(createSingleItemResponse(dto));
});

/**
 * Clear all items from cart
 */
export const clearCart: RequestHandler = catchAsync(async (req, res) => {
  const userId = req.user!.id;
  
  await cartService.clearCart(userId);
  res.status(200).json(createEmptyResponse());
});
