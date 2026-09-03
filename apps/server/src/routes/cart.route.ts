import express from "express";
import * as cartController from "../controllers/cart.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const cartRouter: express.Router = express.Router();

// All cart routes require authentication
cartRouter.use(authenticate);

// Get current user's cart
cartRouter.get("/", ...cartController.getCart);

// Add item to cart
cartRouter.post("/", ...cartController.addToCart);

// Sync local cart with server cart
cartRouter.post("/sync", ...cartController.syncCart);

// Update cart item quantity
cartRouter.patch("/items/:cartItemId", ...cartController.updateCartItem);

// Remove item from cart
cartRouter.delete("/items/:cartItemId", ...cartController.removeFromCart);

// Clear cart
cartRouter.delete("/", ...cartController.clearCart);

export default cartRouter;
