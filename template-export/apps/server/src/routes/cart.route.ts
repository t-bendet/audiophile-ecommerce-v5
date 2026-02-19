import {
  AddToCartRequestSchema,
  ClearCartRequestSchema,
  GetCartRequestSchema,
  RemoveFromCartRequestSchema,
  SyncCartRequestSchema,
  UpdateCartItemRequestSchema,
} from "@repo/domain";
import express from "express";
import * as cartController from "../controllers/cart.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validateSchema } from "../middlewares/validation.middleware.js";

const cartRouter: express.Router = express.Router();

// All cart routes require authentication
cartRouter.use(authenticate);

// Get current user's cart
cartRouter.get(
  "/",
  validateSchema(GetCartRequestSchema),
  cartController.getCart
);

// Add item to cart
cartRouter.post(
  "/",
  validateSchema(AddToCartRequestSchema),
  cartController.addToCart
);

// Sync local cart with server cart
cartRouter.post(
  "/sync",
  validateSchema(SyncCartRequestSchema),
  cartController.syncCart
);

// Update cart item quantity
cartRouter.patch(
  "/items/:cartItemId",
  validateSchema(UpdateCartItemRequestSchema),
  cartController.updateCartItem
);

// Remove item from cart
cartRouter.delete(
  "/items/:cartItemId",
  validateSchema(RemoveFromCartRequestSchema),
  cartController.removeFromCart
);

// Clear cart
cartRouter.delete(
  "/",
  validateSchema(ClearCartRequestSchema),
  cartController.clearCart
);

export default cartRouter;
