// PROTOTYPE (#359): root middlewares that time each navigation and, with cache=cold, drop the
// destination route's queries before its loader runs, so every visit shows its loading state.
// Dropping them at navigation start also discards whatever a hover or focus prefetch fetched.
import cartKeys from "@/features/cart/api/cart-keys";
import orderKeys from "@/features/orders/api/order-keys";
import productKeys from "@/features/products/api/product-keys";
import type { QueryClient, QueryKey } from "@tanstack/react-query";
import type { MiddlewareFunction } from "react-router";
import { proto, setTimings } from "./store";

let navigationStart = 0;

/** First in the root list: wraps everything, so its span is the whole navigation. */
export const probeStart: MiddlewareFunction = async (_args, next) => {
  navigationStart = performance.now();
  setTimings({});
  const response = await next();
  const total = performance.now() - navigationStart;
  setTimings({ ...proto().timings, total: Math.round(total) });
  return response;
};

const destinationKeys = (pathname: string): QueryKey[] => {
  const [, first, second] = pathname.split("/");
  if (pathname === "/")
    return [
      productKeys.featuredProductDetail(),
      productKeys.showCaseProductsList(),
    ];
  if (first === "category" && second)
    return [[...productKeys.lists(), decodeURIComponent(second)]];
  if (first === "product" && second)
    return [
      productKeys.detail(decodeURIComponent(second)),
      [...productKeys.lists(), "related-products"],
    ];
  if (pathname === "/account/orders") return [orderKeys.lists()];
  if (pathname === "/checkout") return [cartKeys.all];
  return [];
};

/** After resolveCurrentUser: records the user wait, then empties the destination's cache. */
export const probeAfterUser =
  (queryClient: QueryClient): MiddlewareFunction =>
  async ({ request }, next) => {
    const user = Math.round(performance.now() - navigationStart);
    setTimings({ user, total: undefined });
    const { pathname } = new URL(request.url);
    // Leave the page on screen alone; only a different destination starts cold.
    if (proto().cache === "cold" && pathname !== window.location.pathname) {
      for (const queryKey of destinationKeys(pathname)) {
        queryClient.removeQueries({ queryKey });
      }
    }
    return next();
  };
