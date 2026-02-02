import type {
  Prisma,
  Cart as PrismaCart,
  CartItem as PrismaCartItem,
} from "@repo/database";
import { z } from "zod";
import {
  createRequestSchema,
  EmptyResponse,
  EmptyResponseSchema,
  ListResponse,
  ListResponseSchema,
  SingleItemResponse,
  SingleItemResponseSchema,
} from "./common.js";
import { IdValidator } from "./shared.js";

// * ===== Database Type Re-exports (Service Generics) =====

export type Cart = PrismaCart;
export type CartItem = PrismaCartItem;
export type CartCreateInput = Prisma.CartCreateInput;
export type CartUpdateInput = Prisma.CartUpdateInput;
export type CartWhereInput = Prisma.CartWhereInput;
export type CartSelect = Prisma.CartSelect;
export type CartItemCreateInput = Prisma.CartItemCreateInput;
export type CartItemUpdateInput = Prisma.CartItemUpdateInput;

// * ===== DTOs =====

/**
 * CartItem DTO - Simplified cart item for client
 */
export const CartItemDTOSchema = z.object({
  id: IdValidator,
  productId: IdValidator,
  productName: z.string(),
  productSlug: z.string(),
  productPrice: z.number().int().positive(),
  productImage: z.string().url(),
  quantity: z.number().int().positive(),
  subtotal: z.number().int().nonnegative(),
});

export type CartItemDTO = z.infer<typeof CartItemDTOSchema>;

/**
 * Cart DTO - Simplified cart for client
 */
export const CartDTOSchema = z.object({
  id: IdValidator,
  userId: IdValidator,
  items: z.array(CartItemDTOSchema),
  itemCount: z.number().int().nonnegative(),
  subtotal: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CartDTO = z.infer<typeof CartDTOSchema>;

// * ===== Input Schemas =====

/**
 * Add item to cart input
 */
export const AddToCartInputSchema = z
  .object({
    productId: IdValidator,
    quantity: z.number().int().positive().default(1),
  })
  .strict();

export type AddToCartInput = z.infer<typeof AddToCartInputSchema>;

/**
 * Update cart item input
 */
export const UpdateCartItemInputSchema = z
  .object({
    quantity: z.number().int().positive(),
  })
  .strict();

export type UpdateCartItemInput = z.infer<typeof UpdateCartItemInputSchema>;

/**
 * Remove item from cart - only needs cartItemId in params
 */
export const RemoveFromCartParamsSchema = z.object({
  cartItemId: IdValidator,
});

export type RemoveFromCartParams = z.infer<typeof RemoveFromCartParamsSchema>;

// * ===== Request Schemas =====

/**
 * Get current user's cart
 */
export const GetCartRequestSchema = createRequestSchema({});

export type GetCartRequest = z.infer<typeof GetCartRequestSchema>;

/**
 * Add to cart request
 */
export const AddToCartRequestSchema = createRequestSchema({
  body: AddToCartInputSchema,
});

export type AddToCartRequest = z.infer<typeof AddToCartRequestSchema>;

/**
 * Update cart item request
 */
export const UpdateCartItemRequestSchema = createRequestSchema({
  params: z.object({ cartItemId: IdValidator }),
  body: UpdateCartItemInputSchema,
});

export type UpdateCartItemRequest = z.infer<
  typeof UpdateCartItemRequestSchema
>;

/**
 * Remove from cart request
 */
export const RemoveFromCartRequestSchema = createRequestSchema({
  params: RemoveFromCartParamsSchema,
});

export type RemoveFromCartRequest = z.infer<
  typeof RemoveFromCartRequestSchema
>;

/**
 * Clear cart request
 */
export const ClearCartRequestSchema = createRequestSchema({});

export type ClearCartRequest = z.infer<typeof ClearCartRequestSchema>;

// * ===== Response Schemas =====

export type GetCartResponse = SingleItemResponse<CartDTO>;
export const GetCartResponseSchema = SingleItemResponseSchema(CartDTOSchema);

export type AddToCartResponse = SingleItemResponse<CartDTO>;
export const AddToCartResponseSchema =
  SingleItemResponseSchema(CartDTOSchema);

export type UpdateCartItemResponse = SingleItemResponse<CartDTO>;
export const UpdateCartItemResponseSchema =
  SingleItemResponseSchema(CartDTOSchema);

export type RemoveFromCartResponse = SingleItemResponse<CartDTO>;
export const RemoveFromCartResponseSchema =
  SingleItemResponseSchema(CartDTOSchema);

export type ClearCartResponse = EmptyResponse;
export const ClearCartResponseSchema = EmptyResponseSchema;
