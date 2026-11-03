// PROTOTYPE (#359): non-component helpers, kept apart so Fast Refresh keeps working.
import type { useCart } from "@/features/cart/api/get-cart";
import type { OrderDTO } from "@repo/domain";

export const hasSkeleton = (pathname: string) =>
  pathname === "/" ||
  pathname.startsWith("/category/") ||
  pathname.startsWith("/product/") ||
  pathname === "/account/orders" ||
  pathname === "/checkout";

/** A stand-in order, so the thank-you can be judged without placing one. */
export const stubOrder = (cartItems: ReturnType<typeof useCart>["data"]) => {
  const items = (cartItems?.data.items ?? []).map((item) => ({
    id: item.id,
    productId: item.productId,
    productName: item.cartLabel,
    productSlug: item.productSlug,
    productImage: item.productImage,
    quantity: item.quantity,
    price: item.productPrice,
    subtotal: item.subtotal,
  }));
  return {
    id: "6727a1f0c3b2a1d4e5f60789",
    items,
    total: items.reduce((sum, item) => sum + item.subtotal, 0) + 5000,
    paymentMethod: "e-Money",
    shippingAddress: { email: "doe@example.com" },
  } as unknown as OrderDTO;
};
