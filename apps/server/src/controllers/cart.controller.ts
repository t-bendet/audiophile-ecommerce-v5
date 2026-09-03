import {
  AddToCartRequestSchema,
  ClearCartRequestSchema,
  createEmptyResponse,
  createSingleItemResponse,
  GetCartRequestSchema,
  RemoveFromCartRequestSchema,
  SyncCartRequestSchema,
  UpdateCartItemRequestSchema,
} from "@repo/domain";
import { cartService } from "../services/cart.service.js";
import { defineHandler, ValidatedHandler } from "../utils/define-handler.js";

/**
 * Get current user's cart
 */
export const getCart: ValidatedHandler = defineHandler(
  GetCartRequestSchema,
  async (req, res) => {
    const userId = req.user!.id; // User is set by auth middleware
    const dto = await cartService.getOrCreateCart(userId);
    res.status(200).json(createSingleItemResponse(dto));
  },
);

/**
 * Add item to cart
 */
export const addToCart: ValidatedHandler = defineHandler(
  AddToCartRequestSchema,
  async (req, res) => {
    const userId = req.user!.id;
    const { productId, quantity } = req.verified.body;

    const dto = await cartService.addToCart(userId, productId, quantity);
    res.status(200).json(createSingleItemResponse(dto));
  },
);

/**
 * Sync local cart with server cart
 */
export const syncCart: ValidatedHandler = defineHandler(
  SyncCartRequestSchema,
  async (req, res) => {
    const userId = req.user!.id;
    const { items } = req.verified.body;

    const dto = await cartService.syncCart(userId, { items });
    res.status(200).json(createSingleItemResponse(dto));
  },
);

/**
 * Update cart item quantity
 */
export const updateCartItem: ValidatedHandler = defineHandler(
  UpdateCartItemRequestSchema,
  async (req, res) => {
    const userId = req.user!.id;
    const { cartItemId } = req.verified.params;
    const { quantity } = req.verified.body;

    const dto = await cartService.updateCartItem(userId, cartItemId, quantity);
    res.status(200).json(createSingleItemResponse(dto));
  },
);

/**
 * Remove item from cart
 */
export const removeFromCart: ValidatedHandler = defineHandler(
  RemoveFromCartRequestSchema,
  async (req, res) => {
    const userId = req.user!.id;
    const { cartItemId } = req.verified.params;

    const dto = await cartService.removeFromCart(userId, cartItemId);
    res.status(200).json(createSingleItemResponse(dto));
  },
);

/**
 * Clear all items from cart
 */
export const clearCart: ValidatedHandler = defineHandler(
  ClearCartRequestSchema,
  async (req, res) => {
    const userId = req.user!.id;

    await cartService.clearCart(userId);
    res.status(200).json(createEmptyResponse());
  },
);
