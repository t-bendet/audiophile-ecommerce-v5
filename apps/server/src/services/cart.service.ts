import { prisma } from "@repo/database";
import {
  AppError,
  Cart,
  CartCreateInput,
  CartDTO,
  CartItemDTO,
  CartUpdateInput,
  ErrorCode,
} from "@repo/domain";
import { AbstractCrudService } from "./abstract-crud.service.js";

export class CartService extends AbstractCrudService<
  Cart,
  CartCreateInput,
  CartUpdateInput,
  CartDTO
> {
  /**
   * Transform Cart entity to CartDTO
   */
  protected toDTO(entity: Cart): CartDTO {
    // Calculate cart items with product details and subtotals
    const items: CartItemDTO[] = (entity.items || []).map((item: any) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.cartLabel,
      productSlug: item.product.slug,
      productPrice: item.product.price,
      productImage: item.product.images.thumbnail.src,
      quantity: item.quantity,
      subtotal: item.product.price * item.quantity,
    }));

    // Calculate totals
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

    return {
      id: entity.id,
      userId: entity.userId,
      items,
      itemCount,
      subtotal,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * Get or create cart for a user
   */
  async getOrCreateCart(userId: string): Promise<CartDTO> {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                cartLabel: true,
                slug: true,
                price: true,
                images: true,
              },
            },
          },
        },
      },
    });

    // Create cart if it doesn't exist
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  cartLabel: true,
                  slug: true,
                  price: true,
                  images: true,
                },
              },
            },
          },
        },
      });
    }

    return this.toDTO(cart as any);
  }

  /**
   * Add item to cart or update quantity if already exists
   */
  async addToCart(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<CartDTO> {
    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      throw new AppError("Product not found", ErrorCode.NOT_FOUND);
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        select: { id: true },
      });
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (existingItem) {
      // Update existing item quantity
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      // Add new item to cart
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
    }

    // Return updated cart
    return this.getOrCreateCart(userId);
  }

  /**
   * Update cart item quantity
   */
  async updateCartItem(
    userId: string,
    cartItemId: string,
    quantity: number,
  ): Promise<CartDTO> {
    if (quantity < 1) {
      throw new AppError(
        "Quantity must be at least 1",
        ErrorCode.INVALID_QUANTITY,
      );
    }

    // Find cart item and verify ownership
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    });

    if (!cartItem) {
      throw new AppError("Cart item not found", ErrorCode.CART_ITEM_NOT_FOUND);
    }

    if (cartItem.cart.userId !== userId) {
      throw new AppError("Unauthorized", ErrorCode.UNAUTHORIZED);
    }

    // Update quantity
    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });

    // Return updated cart
    return this.getOrCreateCart(userId);
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(userId: string, cartItemId: string): Promise<CartDTO> {
    // Find cart item and verify ownership
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    });

    if (!cartItem) {
      throw new AppError("Cart item not found", ErrorCode.CART_ITEM_NOT_FOUND);
    }

    if (cartItem.cart.userId !== userId) {
      throw new AppError("Unauthorized", ErrorCode.UNAUTHORIZED);
    }

    // Delete cart item
    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    // Return updated cart
    return this.getOrCreateCart(userId);
  }

  /**
   * Clear all items from cart
   */
  async clearCart(userId: string): Promise<void> {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!cart) {
      return; // No cart to clear
    }

    // Delete all cart items
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
  }

  // ===== Abstract Method Implementations =====

  protected async persistFindMany(params: {
    page?: number;
    limit?: number;
  }): Promise<{ data: Cart[]; total: number }> {
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const [data, total] = await prisma.$transaction([
      prisma.cart.findMany({
        skip,
        take: limit,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  cartLabel: true,
                  slug: true,
                  price: true,
                  images: true,
                },
              },
            },
          },
        },
      }),
      prisma.cart.count(),
    ]);

    return { data: data as any[], total };
  }

  protected async persistFindById(id: string): Promise<Cart | null> {
    const cart = await prisma.cart.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                cartLabel: true,
                slug: true,
                price: true,
                images: true,
              },
            },
          },
        },
      },
    });

    return cart as any;
  }

  protected async persistCreate(data: CartCreateInput): Promise<Cart> {
    const cart = await prisma.cart.create({
      data,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                cartLabel: true,
                slug: true,
                price: true,
                images: true,
              },
            },
          },
        },
      },
    });

    return cart as any;
  }

  protected async persistUpdate(
    id: string,
    data: CartUpdateInput,
  ): Promise<Cart | null> {
    const cart = await prisma.cart.update({
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
                price: true,
                images: true,
              },
            },
          },
        },
      },
    });

    return cart as any;
  }

  protected async persistDelete(id: string): Promise<boolean> {
    try {
      await prisma.cart.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}

export const cartService = new CartService();
