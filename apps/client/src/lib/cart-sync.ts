import cartKeys from "@/features/cart/api/cart-keys";
import { getCartQueryOptions } from "@/features/cart/api/get-cart";
import { getApi } from "@/lib/api-client";
import { clearGuestCart, getGuestCart } from "@/lib/cart-storage";
import { SyncCartResponseSchema } from "@repo/domain";
import { QueryClient } from "@tanstack/react-query";

/**
 * Sync guest cart to server cart and clear local storage.
 * This utility is shared between login flow and checkout route.
 *
 * @param queryClient - React Query client for cache invalidation
 * @returns Promise that resolves when sync is complete
 */
export async function syncGuestCartToServer(
  queryClient: QueryClient,
): Promise<void> {
  const guestCart = getGuestCart();

  if (guestCart.items.length === 0) {
    // No items to sync
    return;
  }

  try {
    const api = getApi();
    const response = await api.post("/cart/sync", {
      items: guestCart.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    });

    const parsed = SyncCartResponseSchema.parse(response.data);

    // Clear guest cart after successful sync
    clearGuestCart();
    // Seed the authenticated cart cache so the merged cart is available at once
    queryClient.setQueryData(getCartQueryOptions(true).queryKey, parsed);
    // Invalidate cart queries to fetch the merged server cart
    await queryClient.invalidateQueries({ queryKey: cartKeys.all });
  } catch (error) {
    // Log error but don't throw - cart sync is not critical
    if (import.meta.env.DEV) {
      console.error("Failed to sync cart:", error);
    }
  }
}
