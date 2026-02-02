import { prisma } from "@repo/database";
import {
  AppError,
  CreateOrderInput,
  ErrorCode,
  Order,
  OrderCreateInput,
  OrderDTO,
  OrderItemDTO,
  OrderStatus,
  OrderUpdateInput,
  PaymentStatus,
} from "@repo/domain";
import { AbstractCrudService } from "./abstract-crud.service.js";
import { cartService } from "./cart.service.js";

export class OrderService extends AbstractCrudService<
  Order,
  OrderCreateInput,
  OrderUpdateInput,
  OrderDTO
> {
  /**
   * Transform Order entity to OrderDTO
   */
  protected toDTO(entity: Order): OrderDTO {
    // Transform order items with product details
    const items: OrderItemDTO[] = (entity.items || []).map((item: any) => ({
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
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  /**
   * Create order from cart
   */
  async createOrder(
    userId: string,
    orderInput: CreateOrderInput
  ): Promise<OrderDTO> {
    // Get user's cart
    const cart = await cartService.getOrCreateCart(userId);

    // Validate cart has items
    if (!cart.items || cart.items.length === 0) {
      throw new AppError("Cannot create order from empty cart", ErrorCode.CART_EMPTY);
    }

    // Calculate order totals
    const subtotal = cart.subtotal;
    const shippingCost = 50; // Fixed shipping cost (can be dynamic later)
    const taxRate = 0.2; // 20% tax rate
    const tax = Math.round(subtotal * taxRate);
    const total = subtotal + shippingCost + tax;

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
          paymentStatus: PaymentStatus.PENDING,
          status: OrderStatus.PENDING,
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
          })
        )
      );

      // Clear cart after successful order creation
      await tx.cartItem.deleteMany({
        where: { cart: { userId } },
      });

      // Fetch complete order with items
      return tx.order.findUnique({
        where: { id: newOrder.id },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  cartLabel: true,
                  slug: true,
                  images: true,
                },
              },
            },
          },
        },
      });
    });

    if (!order) {
      throw new AppError(
        "Failed to create order",
        ErrorCode.OPERATION_FAILED
      );
    }

    return this.toDTO(order as any);
  }

  /**
   * Get order by ID with authorization check
   */
  async getOrderById(userId: string, orderId: string): Promise<OrderDTO> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                cartLabel: true,
                slug: true,
                images: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new AppError("Order not found", ErrorCode.ORDER_NOT_FOUND);
    }

    // Verify ownership
    if (order.userId !== userId) {
      throw new AppError("Unauthorized", ErrorCode.UNAUTHORIZED);
    }

    return this.toDTO(order as any);
  }

  /**
   * List orders for a user
   */
  async listUserOrders(
    userId: string,
    query: {
      page?: number;
      limit?: number;
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
    }
  ): Promise<{ data: OrderDTO[]; meta: any }> {
    const { page = 1, limit = 10, status, paymentStatus } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { userId };
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    const [data, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  cartLabel: true,
                  slug: true,
                  images: true,
                },
              },
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      data: data.map((order) => this.toDTO(order as any)),
      meta: { page, limit, total, totalPages, hasNext, hasPrev },
    };
  }

  /**
   * Update order status (admin only)
   */
  async updateOrderStatus(
    orderId: string,
    status: OrderStatus
  ): Promise<OrderDTO> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new AppError("Order not found", ErrorCode.ORDER_NOT_FOUND);
    }

    // Validate status transition
    if (order.status === OrderStatus.CANCELLED) {
      throw new AppError(
        "Cannot update cancelled order",
        ErrorCode.ORDER_ALREADY_PROCESSED
      );
    }

    if (order.status === OrderStatus.DELIVERED && status !== OrderStatus.CANCELLED) {
      throw new AppError(
        "Cannot update delivered order",
        ErrorCode.ORDER_ALREADY_PROCESSED
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                cartLabel: true,
                slug: true,
                images: true,
              },
            },
          },
        },
      },
    });

    return this.toDTO(updatedOrder as any);
  }

  // ===== Abstract Method Implementations =====

  protected async persistFindMany(params: {
    page?: number;
    limit?: number;
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
  }): Promise<{ data: Order[]; total: number }> {
    const { page = 1, limit = 20, status, paymentStatus } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    const [data, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  cartLabel: true,
                  slug: true,
                  images: true,
                },
              },
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return { data: data as any[], total };
  }

  protected async persistFindById(id: string): Promise<Order | null> {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                cartLabel: true,
                slug: true,
                images: true,
              },
            },
          },
        },
      },
    });

    return order as any;
  }

  protected async persistCreate(data: OrderCreateInput): Promise<Order> {
    const order = await prisma.order.create({
      data,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                cartLabel: true,
                slug: true,
                images: true,
              },
            },
          },
        },
      },
    });

    return order as any;
  }

  protected async persistUpdate(
    id: string,
    data: OrderUpdateInput
  ): Promise<Order | null> {
    const order = await prisma.order.update({
      where: { id },
      data,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                cartLabel: true,
                slug: true,
                images: true,
              },
            },
          },
        },
      },
    });

    return order as any;
  }

  protected async persistDelete(id: string): Promise<boolean> {
    try {
      await prisma.order.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}

export const orderService = new OrderService();
