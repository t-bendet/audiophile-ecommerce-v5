import { CartItemDTOSchema } from "@repo/domain";
import * as z from "zod";

// The guest cart a signed-out shopper keeps in localStorage: a server cart item
// without the id the server assigns.
const GuestCartItemSchema = CartItemDTOSchema.omit({ id: true }).extend({
  id: z.string().optional(),
});

const GuestCartSchema = z.object({
  items: z.array(GuestCartItemSchema),
  itemCount: z.number().int().nonnegative(),
  subtotal: z.number().int().nonnegative(),
});

export type GuestCartItem = z.infer<typeof GuestCartItemSchema>;
export type GuestCart = z.infer<typeof GuestCartSchema>;
export type GuestCartItemInput = Omit<GuestCartItem, "id" | "subtotal">;

const EmptyGuestCart: GuestCart = {
  items: [],
  itemCount: 0,
  subtotal: 0,
};

const CART_STORAGE_KEY = "audiophile_cart";

/**
 * Get cart from localStorage
 */
export function getGuestCart(): GuestCart {
  if (typeof window === "undefined") {
    return { ...EmptyGuestCart };
  }

  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) {
      return { ...EmptyGuestCart };
    }

    // A cart stored before the thumbnail became a key cannot be rendered.
    const parsed = GuestCartSchema.safeParse(JSON.parse(stored));
    return parsed.success ? parsed.data : { ...EmptyGuestCart };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Error reading cart from localStorage:", error);
    }
    return { ...EmptyGuestCart };
  }
}

/**
 * Save cart to localStorage
 */
export function saveGuestCart(cart: GuestCart): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Error saving cart to localStorage:", error);
    }
  }
}

/**
 * Calculate cart totals
 */
function calculateCartTotals(items: GuestCartItem[]): {
  itemCount: number;
  subtotal: number;
} {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  return { itemCount, subtotal };
}

export function addToGuestCart(input: GuestCartItemInput): GuestCart {
  const cart = getGuestCart();

  const existingItem = cart.items.find(
    (item) => item.productId === input.productId,
  );

  if (existingItem) {
    existingItem.quantity += input.quantity;
    existingItem.subtotal = existingItem.quantity * existingItem.productPrice;
  } else {
    cart.items.push({
      ...input,
      subtotal: input.productPrice * input.quantity,
    });
  }

  const totals = calculateCartTotals(cart.items);
  cart.itemCount = totals.itemCount;
  cart.subtotal = totals.subtotal;

  saveGuestCart(cart);
  return cart;
}

/**
 * Update cart item quantity
 */
export function updateGuestCartItem(
  productId: string,
  quantity: number,
): GuestCart {
  const cart = getGuestCart();

  const itemIndex = cart.items.findIndex(
    (item) => item.productId === productId,
  );

  if (itemIndex !== -1) {
    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].subtotal =
      cart.items[itemIndex].productPrice * quantity;
  }

  const totals = calculateCartTotals(cart.items);
  cart.itemCount = totals.itemCount;
  cart.subtotal = totals.subtotal;

  saveGuestCart(cart);
  return cart;
}

export function removeFromGuestCart(productId: string): GuestCart {
  const cart = getGuestCart();

  cart.items = cart.items.filter((item) => item.productId !== productId);

  const totals = calculateCartTotals(cart.items);
  cart.itemCount = totals.itemCount;
  cart.subtotal = totals.subtotal;

  saveGuestCart(cart);
  return cart;
}

export function clearGuestCart(): GuestCart {
  saveGuestCart({ ...EmptyGuestCart });
  return { ...EmptyGuestCart };
}
