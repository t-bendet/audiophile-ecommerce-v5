import { CartItemDTO } from "@repo/domain";

export interface LocalCartItem extends Omit<CartItemDTO, "id"> {
  id?: string; // Optional for local items
}

export interface LocalCart {
  items: LocalCartItem[];
  itemCount: number;
  subtotal: number;
}

const CART_STORAGE_KEY = "audiophile_cart";

/**
 * Get cart from localStorage
 */
export function getLocalCart(): LocalCart {
  if (typeof window === "undefined") {
    return { items: [], itemCount: 0, subtotal: 0 };
  }

  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) {
      return { items: [], itemCount: 0, subtotal: 0 };
    }

    const parsed = JSON.parse(stored);
    return parsed as LocalCart;
  } catch (error) {
    console.error("Error reading cart from localStorage:", error);
    return { items: [], itemCount: 0, subtotal: 0 };
  }
}

/**
 * Save cart to localStorage
 */
export function saveLocalCart(cart: LocalCart): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error("Error saving cart to localStorage:", error);
  }
}

/**
 * Calculate cart totals
 */
function calculateCartTotals(items: LocalCartItem[]): {
  itemCount: number;
  subtotal: number;
} {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  return { itemCount, subtotal };
}

/**
 * Add item to local cart
 */
export function addToLocalCart(
  productId: string,
  productName: string,
  productSlug: string,
  productPrice: number,
  productImage: string,
  quantity: number,
): LocalCart {
  const cart = getLocalCart();

  // Check if item already exists
  const existingItemIndex = cart.items.findIndex(
    (item) => item.productId === productId,
  );

  if (existingItemIndex !== -1) {
    // Update quantity of existing item
    cart.items[existingItemIndex].quantity += quantity;
    cart.items[existingItemIndex].subtotal =
      cart.items[existingItemIndex].quantity *
      cart.items[existingItemIndex].productPrice;
  } else {
    // Add new item
    cart.items.push({
      productId,
      productName,
      productSlug,
      productPrice,
      productImage,
      quantity,
      subtotal: productPrice * quantity,
    });
  }

  const totals = calculateCartTotals(cart.items);
  cart.itemCount = totals.itemCount;
  cart.subtotal = totals.subtotal;

  saveLocalCart(cart);
  return cart;
}

/**
 * Update cart item quantity
 */
export function updateLocalCartItem(
  productId: string,
  quantity: number,
): LocalCart {
  const cart = getLocalCart();

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

  saveLocalCart(cart);
  return cart;
}

/**
 * Remove item from local cart
 */
export function removeFromLocalCart(productId: string): LocalCart {
  const cart = getLocalCart();

  cart.items = cart.items.filter((item) => item.productId !== productId);

  const totals = calculateCartTotals(cart.items);
  cart.itemCount = totals.itemCount;
  cart.subtotal = totals.subtotal;

  saveLocalCart(cart);
  return cart;
}

/**
 * Clear local cart
 */
export function clearLocalCart(): LocalCart {
  const emptyCart = { items: [], itemCount: 0, subtotal: 0 };
  saveLocalCart(emptyCart);
  return emptyCart;
}
