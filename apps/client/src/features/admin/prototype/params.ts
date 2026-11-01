// PROTOTYPE: URL state shared by every variant (#320).
import { useCallback } from "react";
import { useSearchParams } from "react-router";

export const PAGES = [
  "stats",
  "orders",
  "order",
  "users",
  "user",
  "products",
  "product",
  "homepage",
] as const;
export type Page = (typeof PAGES)[number];

export const STATES = ["data", "empty", "loading", "error"] as const;
export type ViewState = (typeof STATES)[number];

export const NAV: { page: Page; label: string }[] = [
  { page: "orders", label: "Orders" },
  { page: "users", label: "Users" },
  { page: "products", label: "Products" },
  { page: "homepage", label: "Homepage" },
  { page: "stats", label: "Stats" },
];

export const PAGE_TITLES: Record<Page, string> = {
  stats: "Stats",
  orders: "Orders",
  order: "Order",
  users: "Users",
  user: "User",
  products: "Products",
  product: "Edit product",
  homepage: "Homepage",
};

// The nav entry a page belongs to, so detail pages light up their section.
export const sectionOf = (page: Page): Page =>
  page === "order"
    ? "orders"
    : page === "user"
      ? "users"
      : page === "product"
        ? "products"
        : page;

export type VariantProps = {
  page: Page;
  state: ViewState;
  go: (page: Page) => void;
};

const isPage = (v: string | null): v is Page => PAGES.includes(v as Page);
const isState = (v: string | null): v is ViewState =>
  STATES.includes(v as ViewState);

export function usePrototypeParams() {
  const [params, setParams] = useSearchParams();
  const variant = params.get("variant") ?? "A";
  const page: Page = isPage(params.get("page"))
    ? (params.get("page") as Page)
    : "orders";
  const state: ViewState = isState(params.get("state"))
    ? (params.get("state") as ViewState)
    : "data";

  const set = useCallback(
    (key: string, value: string) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set(key, value);
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const go = useCallback((next: Page) => set("page", next), [set]);

  return { variant, page, state, set, go };
}
