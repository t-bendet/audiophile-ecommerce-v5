import cartKeys from "@/features/cart/api/cart-keys";
import { getApi } from "@/lib/api-client";
import { clearLocalCart, getLocalCart } from "@/lib/cart-storage";
import { QueryClient } from "@tanstack/react-query";

/**
 * Sync local cart to server cart and clear local storage.
 * This utility is shared between login flow and checkout route.
 *
 * @param queryClient - React Query client for cache invalidation
 * @returns Promise that resolves when sync is complete
 */
export async function syncLocalCartToServer(
  queryClient: QueryClient,
): Promise<void> {
  const localCart = getLocalCart();

  if (localCart.items.length === 0) {
    // No items to sync
    return;
  }

  try {
    // TODO optimize by sending only changed items instead of full cart, but this is simpler for now and cart sizes are expected to be small
    // TODO handle potential merge conflicts (e.g. same product in both carts) - for now we just let the server handle merging logic and assume it will sum quantities, but we might want to add client-side logic later to provide better UX
    // TODO mutation to sync cart on the server and return the merged cart, so we can update local cache immediately without waiting for next fetch - this would require changes to our API and cart hooks, so we can consider it as a future enhancement
    const api = getApi();
    await api.post("/cart/sync", {
      items: localCart.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    });
    // Clear local cart after successful sync
    clearLocalCart();
    // Invalidate cart queries to fetch the merged server cart
    await queryClient.invalidateQueries({ queryKey: cartKeys.all });
  } catch (error) {
    // Log error but don't throw - cart sync is not critical
    console.error("Failed to sync cart:", error);
  }
}
