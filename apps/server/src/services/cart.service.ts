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
import { toImageVariantDTO } from "../utils/media.js";
import { isUniqueConstraintError } from "../utils/prisma-errors.js";
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
      cartLabel: item.product.cartLabel,
      productSlug: item.product.slug,
      productPrice: item.product.price,
      productImage: toImageVariantDTO(item.product.images.thumbnail.image),
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
    const cart = await this.retryOnDuplicate(() =>
      prisma.cart.upsert({
        where: { userId },
        create: { userId },
        update: {},
        include: cartWithProductsInclude,
      }),
    );

    return this.toDTO(cart);
  }

  private async ensureCartId(userId: string): Promise<string> {
    const cart = await this.retryOnDuplicate(() =>
      prisma.cart.upsert({
        where: { userId },
        create: { userId },
        update: {},
        select: { id: true },
      }),
    );

    return cart.id;
  }

  // Prisma's MongoDB upsert is find-then-write, so concurrent first writes can still hit P2002
  private async retryOnDuplicate<T>(upsert: () => Promise<T>): Promise<T> {
    try {
      return await upsert();
    } catch (e) {
      if (!isUniqueConstraintError(e)) throw e;
      return upsert();
    }
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

    const cartId = await this.ensureCartId(userId);

    await this.retryOnDuplicate(() =>
      this.incrementCartItem(cartId, productId, quantity),
    );

    // Return updated cart
    return this.getOrCreateCart(userId);
  }

  // The database does the arithmetic: `increment` is an atomic `$inc` on the line
  private incrementCartItem(
    cartId: string,
    productId: string,
    quantity: number,
  ): Prisma.PrismaPromise<unknown> {
    return prisma.cartItem.upsert({
      where: { cartId_productId: { cartId, productId } },
      create: { cartId, productId, quantity },
      update: { quantity: { increment: quantity } },
      select: { id: true },
    });
  }

  /**
   * Sync guest cart items with server cart
   * Merges items from guest cart into the user's server-side cart
   * If an item already exists, updates quantity to be the sum of both
   */
  async syncCart(userId: string, input: SyncCartInput): Promise<CartDTO> {
    if (!input.items || input.items.length === 0) {
      // No items to sync, just return current cart
      return this.getOrCreateCart(userId);
    }

    const cartId = await this.ensureCartId(userId);

    // Verify all products exist in a single batch query
    const productIds = input.items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true },
    });

    const validProductIds = new Set(products.map((p) => p.id));
    const localItems = input.items.filter((item) =>
      validProductIds.has(item.productId),
    );

    // All merge writes land together or not at all; a P2002 aborts the batch, so the retry re-runs every line
    await this.retryOnDuplicate(() =>
      prisma.$transaction(
        localItems.map((item) =>
          this.incrementCartItem(cartId, item.productId, item.quantity),
        ),
      ),
    );

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
      throw new AppError("Forbidden", ErrorCode.FORBIDDEN);
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
      throw new AppError("Forbidden", ErrorCode.FORBIDDEN);
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
    return this.nullOnMissingRecord(() =>
      prisma.cart.update({
        where: { id },
        data,
        include: cartWithProductsInclude,
      }),
    );
  }

  protected async persistDelete(id: string): Promise<boolean> {
    return this.falseOnMissingRecord(() =>
      prisma.cart.delete({ where: { id } }),
    );
  }
}

export const cartService = new CartService();
