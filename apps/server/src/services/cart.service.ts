import { prisma, Prisma } from "@repo/database";
import {
  AppError,
  CartCreateInput,
  CartDTO,
  CartItemDTO,
  CartUpdateInput,
  ErrorCode,
  SyncCartInput,
} from "@repo/domain";
import { AbstractCrudService } from "./abstract-crud.service.js";

const cartWithProductsInclude = {
  items: {
    include: {
      product: {
        select: {
          id: true,
          cartLabel: true,
          slug: true,
          price: true,
          images: {
            select: {
              thumbnail: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.CartInclude;

type CartWithProducts = Prisma.CartGetPayload<{
  include: typeof cartWithProductsInclude;
}>;

export class CartService extends AbstractCrudService<
  CartWithProducts,
  CartCreateInput,
  CartUpdateInput,
  CartDTO
> {
  /**
   * Transform Cart entity to CartDTO
   */
  protected toDTO(entity: CartWithProducts): CartDTO {
    // Calculate cart items with product details and subtotals
    const items: CartItemDTO[] = (entity.items || []).map((item) => ({
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
      include: cartWithProductsInclude,
    });

    // Create cart if it doesn't exist
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: cartWithProductsInclude,
      });
    }

    return this.toDTO(cart);
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
   * Sync local cart items with server cart
   * Merges items from local cart into the user's server-side cart
   * If an item already exists, updates quantity to be the sum of both
   */
  async syncCart(userId: string, input: SyncCartInput): Promise<CartDTO> {
    if (!input.items || input.items.length === 0) {
      // No items to sync, just return current cart
      return this.getOrCreateCart(userId);
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

    // Verify all products exist in a single batch query
    const productIds = input.items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true },
    });

    const validProductIds = new Set(products.map((p) => p.id));

    // Fetch all existing cart items in a single batch query
    const existingCartItems = await prisma.cartItem.findMany({
      where: {
        cartId: cart.id,
        productId: { in: productIds },
      },
      select: { id: true, productId: true, quantity: true },
    });

    // Create a map for quick lookup
    const existingItemMap = new Map(
      existingCartItems.map((item) => [item.productId, item]),
    );

    // Process items in parallel using Promise.all
    const operations: Promise<unknown>[] = [];

    for (const localItem of input.items) {
      // Skip items with invalid products
      if (!validProductIds.has(localItem.productId)) {
        continue;
      }

      const existingItem = existingItemMap.get(localItem.productId);

      if (existingItem) {
        // Update existing item quantity (add local quantity to server quantity)
        operations.push(
          prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: existingItem.quantity + localItem.quantity },
          }),
        );
      } else {
        // Add new item to cart
        operations.push(
          prisma.cartItem.create({
            data: {
              cartId: cart.id,
              productId: localItem.productId,
              quantity: localItem.quantity,
            },
          }),
        );
      }
    }

    // Execute all operations in parallel
    await Promise.all(operations);

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
  }): Promise<{ data: CartWithProducts[]; total: number }> {
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const [data, total] = await prisma.$transaction([
      prisma.cart.findMany({
        skip,
        take: limit,
        include: cartWithProductsInclude,
      }),
      prisma.cart.count(),
    ]);

    return { data: data, total };
  }

  protected async persistFindById(
    id: string,
  ): Promise<CartWithProducts | null> {
    const cart = await prisma.cart.findUnique({
      where: { id },
      include: cartWithProductsInclude,
    });

    return cart;
  }

  protected async persistCreate(
    data: CartCreateInput,
  ): Promise<CartWithProducts> {
    const cart = await prisma.cart.create({
      data,
      include: cartWithProductsInclude,
    });

    return cart;
  }

  protected async persistUpdate(
    id: string,
    data: CartUpdateInput,
  ): Promise<CartWithProducts | null> {
    const cart = await prisma.cart.update({
      where: { id },
      data,
      include: cartWithProductsInclude,
    });

    return cart;
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
