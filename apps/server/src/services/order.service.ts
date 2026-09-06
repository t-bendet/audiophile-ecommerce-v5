import { prisma } from "@repo/database";
import {
  AppError,
  calculateOrderTotals,
  CreateOrderInput,
  ErrorCode,
  type Meta,
  Order,
  OrderCreateInput,
  OrderDTO,
  ORDER_INCLUDE,
  OrderItemDTO,
  OrderQueryParams,
  type OrderStatus,
  ORDER_STATUS,
  OrderUpdateInput,
  OrderWhereInput,
  type PaymentStatus,
  PAYMENT_STATUS,
} from "@repo/domain";
import { buildMeta, parsePagination, type Pagination } from "../utils/query.js";
import { AbstractCrudService } from "./abstract-crud.service.js";
import { cartService } from "./cart.service.js";

export class OrderService extends AbstractCrudService<
  Order,
  OrderCreateInput,
  OrderUpdateInput,
  OrderDTO,
  OrderQueryParams
> {
  /**
   * Transform Order entity to OrderDTO
   */
  protected toDTO(entity: Order): OrderDTO {
    // Transform order items with product details
    const items: OrderItemDTO[] = (entity.items || []).map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.cartLabel,
      productSlug: item.product.slug,
      productImage: item.product.images.thumbnail.src,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity,
    }));

    return {
      id: entity.id,
      userId: entity.userId,
      items,
      status: entity.status,
      subtotal: entity.subtotal,
      shippingCost: entity.shippingCost,
      tax: entity.tax,
      total: entity.total,
      shippingAddress: entity.shippingAddress,
      billingAddress: entity.billingAddress,
      paymentMethod: entity.paymentMethod,
      paymentStatus: entity.paymentStatus,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * Create order from cart
   */
  async createOrder(
    userId: string,
    orderInput: CreateOrderInput,
  ): Promise<OrderDTO> {
    // Get user's cart
    const cart = await cartService.getOrCreateCart(userId);

    // Validate cart has items
    if (!cart.items || cart.items.length === 0) {
      throw new AppError(
        "Cannot create order from empty cart",
        ErrorCode.CART_EMPTY,
      );
    }

    // Calculate order totals
    const { subtotal, shippingCost, tax, total } = calculateOrderTotals(
      cart.subtotal,
    );

    // Create order with items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          userId,
          subtotal,
          shippingCost,
          tax,
          total,
          shippingAddress: orderInput.shippingAddress,
          billingAddress: orderInput.billingAddress,
          paymentMethod: orderInput.paymentMethod,
          paymentStatus: PAYMENT_STATUS.PENDING,
          status: ORDER_STATUS.PENDING,
        },
      });

      // Create order items from cart items
      await Promise.all(
        cart.items.map((cartItem) =>
          tx.orderItem.create({
            data: {
              orderId: newOrder.id,
              productId: cartItem.productId,
              quantity: cartItem.quantity,
              price: cartItem.productPrice, // Capture current price
            },
          }),
        ),
      );

      // Clear cart after successful order creation
      await tx.cartItem.deleteMany({
        where: { cart: { userId } },
      });

      // Fetch complete order with items
      return tx.order.findUnique({
        where: { id: newOrder.id },
        include: ORDER_INCLUDE,
      });
    });

    if (!order) {
      throw new AppError("Failed to create order", ErrorCode.OPERATION_FAILED);
    }

    return this.toDTO(order);
  }

  /**
   * Get order by ID with authorization check
   */
  async getOrderById(userId: string, orderId: string): Promise<OrderDTO> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: ORDER_INCLUDE,
    });

    if (!order) {
      throw new AppError("Order not found", ErrorCode.ORDER_NOT_FOUND);
    }

    // Verify ownership
    if (order.userId !== userId) {
      throw new AppError("Forbidden", ErrorCode.FORBIDDEN);
    }

    return this.toDTO(order);
  }

  /**
   * List orders for a user
   */
  async listUserOrders(
    userId: string,
    query: OrderQueryParams,
  ): Promise<{ data: OrderDTO[]; meta: Meta }> {
    const { status, paymentStatus } = query;
    const { page, limit, skip, take } = parsePagination(query);

    const where = this.buildOrderWhere({ status, paymentStatus, userId });

    const [data, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: ORDER_INCLUDE,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      data: data.map((order) => this.toDTO(order)),
      meta: buildMeta({ page, limit, total }),
    };
  }

  /**
   * Update order status (admin only)
   */
  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
  ): Promise<OrderDTO> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new AppError("Order not found", ErrorCode.ORDER_NOT_FOUND);
    }

    // Validate status transition
    if (order.status === ORDER_STATUS.CANCELLED) {
      throw new AppError(
        "Cannot update cancelled order",
        ErrorCode.ORDER_ALREADY_PROCESSED,
      );
    }

    if (
      order.status === ORDER_STATUS.DELIVERED &&
      status !== ORDER_STATUS.CANCELLED
    ) {
      throw new AppError(
        "Cannot update delivered order",
        ErrorCode.ORDER_ALREADY_PROCESSED,
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: ORDER_INCLUDE,
    });

    return this.toDTO(updatedOrder);
  }

  // ===== Private Query Builders =====

  private buildOrderWhere({
    userId,
    status,
    paymentStatus,
  }: {
    userId?: string;
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
  }): OrderWhereInput {
    return {
      ...(userId && { userId }),
      ...(status && { status }),
      ...(paymentStatus && { paymentStatus }),
    };
  }

  // ===== Abstract Method Implementations =====

  protected async persistFindMany(
    params: Pagination & OrderQueryParams,
  ): Promise<{ data: Order[]; total: number }> {
    const { skip, take, status, paymentStatus } = params;

    const where = this.buildOrderWhere({ status, paymentStatus });

    const [data, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: ORDER_INCLUDE,
      }),
      prisma.order.count({ where }),
    ]);

    return { data, total };
  }

  protected async persistFindById(id: string): Promise<Order | null> {
    const order = await prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });

    return order;
  }

  protected async persistCreate(data: OrderCreateInput): Promise<Order> {
    const order = await prisma.order.create({
      data,
      include: ORDER_INCLUDE,
    });

    return order;
  }

  protected async persistUpdate(
    id: string,
    data: OrderUpdateInput,
  ): Promise<Order | null> {
    return this.nullOnMissingRecord(() =>
      prisma.order.update({ where: { id }, data, include: ORDER_INCLUDE }),
    );
  }

  protected async persistDelete(id: string): Promise<boolean> {
    return this.falseOnMissingRecord(() =>
      prisma.order.delete({ where: { id } }),
    );
  }
}

export const orderService = new OrderService();
