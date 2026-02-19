import type {
  BillingAddress,
  Prisma,
  Order as PrismaOrder,
  OrderItem as PrismaOrderItem,
  ShippingAddress,
} from "@repo/database";
import { z } from "zod";
import {
  createRequestSchema,
  ListResponse,
  ListResponseSchema,
  SingleItemResponse,
  SingleItemResponseSchema,
} from "./common.js";
import { IdValidator } from "./shared.js";

// * ===== Database Type Re-exports (Service Generics) =====

export type OrderItem = PrismaOrderItem;
export type Order = PrismaOrder & { items: OrderItem[] };
export type OrderCreateInput = Prisma.OrderCreateInput;
export type OrderUpdateInput = Prisma.OrderUpdateInput;
export type OrderWhereInput = Prisma.OrderWhereInput;
export type OrderSelect = Prisma.OrderSelect;

// * ===== Re-export enums and types =====

const ORDER_STATUS = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
} as const;

const PAYMENT_STATUS = {
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const;

type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];
type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export { ORDER_STATUS, PAYMENT_STATUS };
export type { BillingAddress, ShippingAddress, OrderStatus, PaymentStatus };

// * ===== Common Schemas =====

export const OrderStatusSchema = z.enum([
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
]);

export const PaymentStatusSchema = z.enum([
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
]);

export const ShippingAddressSchema = z
  .object({
    fullName: z.string().min(1, "Full name is required"),
    email: z.email("Valid email is required"),
    phone: z.string().min(1, "Phone is required"),
    address: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zipCode: z.string().min(1, "Zip code is required"),
    country: z.string().min(1, "Country is required"),
  })
  .strict();

export const BillingAddressSchema = z
  .object({
    fullName: z.string().min(1, "Full name is required"),
    address: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zipCode: z.string().min(1, "Zip code is required"),
    country: z.string().min(1, "Country is required"),
  })
  .strict();

// * ===== DTOs =====

/**
 * OrderItem DTO - Simplified order item for client
 */
export const OrderItemDTOSchema = z.object({
  id: IdValidator(),
  productId: IdValidator(),
  productName: z.string(),
  productSlug: z.string(),
  productImage: z.url(),
  quantity: z.number().int().positive(),
  price: z.number().int().positive(),
  subtotal: z.number().int().nonnegative(),
});

export type OrderItemDTO = z.infer<typeof OrderItemDTOSchema>;

/**
 * Order DTO - Simplified order for client
 */
export const OrderDTOSchema = z.object({
  id: IdValidator(),
  userId: IdValidator(),
  items: z.array(OrderItemDTOSchema),
  status: OrderStatusSchema,
  subtotal: z.number().int().nonnegative(),
  shippingCost: z.number().int().nonnegative(),
  tax: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  shippingAddress: ShippingAddressSchema,
  billingAddress: BillingAddressSchema,
  paymentMethod: z.string(),
  paymentStatus: PaymentStatusSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type OrderDTO = z.infer<typeof OrderDTOSchema>;

// * ===== Input Schemas =====

/**
 * Create order input
 */
export const CreateOrderInputSchema = z
  .object({
    shippingAddress: ShippingAddressSchema,
    billingAddress: BillingAddressSchema,
    paymentMethod: z.string().min(1, "Payment method is required"),
  })
  .strict();

export type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>;

/**
 * Update order status input (admin only)
 */
export const UpdateOrderStatusInputSchema = z
  .object({
    status: OrderStatusSchema,
  })
  .strict();

export type UpdateOrderStatusInput = z.infer<
  typeof UpdateOrderStatusInputSchema
>;

/**
 * Order query params
 */
export const OrderQueryParamsSchema = z.object({
  status: OrderStatusSchema.optional(),
  paymentStatus: PaymentStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sort: z.string().optional(),
});

export type OrderQueryParams = z.infer<typeof OrderQueryParamsSchema>;

// * ===== Request Schemas =====

/**
 * Create order request
 */
export const CreateOrderRequestSchema = createRequestSchema({
  body: CreateOrderInputSchema,
});

export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;

/**
 * Get order by ID request
 */
export const GetOrderRequestSchema = createRequestSchema({
  params: z.object({ orderId: IdValidator }),
});

export type GetOrderRequest = z.infer<typeof GetOrderRequestSchema>;

/**
 * List orders request
 */
export const ListOrdersRequestSchema = createRequestSchema({
  query: OrderQueryParamsSchema,
});

export type ListOrdersRequest = z.infer<typeof ListOrdersRequestSchema>;

/**
 * Update order status request (admin only)
 */
export const UpdateOrderStatusRequestSchema = createRequestSchema({
  params: z.object({ orderId: IdValidator }),
  body: UpdateOrderStatusInputSchema,
});

export type UpdateOrderStatusRequest = z.infer<
  typeof UpdateOrderStatusRequestSchema
>;

// * ===== Response Schemas =====

export type CreateOrderResponse = SingleItemResponse<OrderDTO>;
export const CreateOrderResponseSchema =
  SingleItemResponseSchema(OrderDTOSchema);

export type GetOrderResponse = SingleItemResponse<OrderDTO>;
export const GetOrderResponseSchema = SingleItemResponseSchema(OrderDTOSchema);

export type ListOrdersResponse = ListResponse<OrderDTO>;
export const ListOrdersResponseSchema = ListResponseSchema(OrderDTOSchema);

export type UpdateOrderStatusResponse = SingleItemResponse<OrderDTO>;
export const UpdateOrderStatusResponseSchema =
  SingleItemResponseSchema(OrderDTOSchema);
