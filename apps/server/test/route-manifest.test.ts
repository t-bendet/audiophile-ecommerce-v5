import { describe, expect, it } from "vitest";
import app from "../src/app.js";
import adminRouter from "../src/routes/admin.route.js";
import authRouter from "../src/routes/auth.route.js";
import cartRouter from "../src/routes/cart.route.js";
import categoryRouter from "../src/routes/category.route.js";
import configRouter from "../src/routes/config.route.js";
import healthRouter from "../src/routes/health.route.js";
import indexRoute from "../src/routes/index.js";
import orderRouter from "../src/routes/order.route.js";
import productRouter from "../src/routes/product.route.js";
import sitemapRouter from "../src/routes/sitemap.route.js";
import userRouter from "../src/routes/user.route.js";

// Reads Express internals: keep the walk here, never in production code.

type RouteLayer = {
  name: string;
  handle: unknown;
  route?: {
    path: string;
    methods: Record<string, boolean>;
    stack: unknown[];
  };
};

type StackHolder = { stack: RouteLayer[] };

// Express 5 hides the mount prefix in the parent matcher: name groups by identity.
const ROUTER_NAMES = new Map<unknown, string>([
  [indexRoute, "api/v1"],
  [sitemapRouter, "sitemap.xml"],
  [healthRouter, "health"],
  [userRouter, "users"],
  [authRouter, "auth"],
  [categoryRouter, "categories"],
  [productRouter, "products"],
  [configRouter, "config"],
  [cartRouter, "cart"],
  [orderRouter, "orders"],
  [adminRouter, "admin"],
]);

const isStackHolder = (value: unknown): value is StackHolder =>
  typeof value === "function" && Array.isArray((value as StackHolder).stack);

const describeLayer = (layer: RouteLayer): string => {
  const { route } = layer;
  if (!route) return `use ${layer.name || "<anonymous>"}`;

  const methods = Object.keys(route.methods).sort().join("|");
  return `${methods} ${route.path} [${route.stack.length} handlers]`;
};

const walk = (router: StackHolder, indent = ""): string[] =>
  router.stack.flatMap((layer) => {
    const group = ROUTER_NAMES.get(layer.handle);
    if (group && isStackHolder(layer.handle)) {
      return [`${indent}${group}`, ...walk(layer.handle, `${indent}  `)];
    }
    return [`${indent}${describeLayer(layer)}`];
  });

// The app's own stack also holds the logging, security and parsing
// middleware and the catch-all 404; only the mounted routers are the manifest.
const mountedRouters = (): StackHolder => ({
  stack: (app.router as unknown as StackHolder).stack.filter((layer) =>
    ROUTER_NAMES.has(layer.handle),
  ),
});

describe("route manifest", () => {
  it("mounts every route with the same middleware chain", () => {
    expect(walk(mountedRouters()).join("\n")).toMatchInlineSnapshot(`
      "api/v1
        health
          get / [1 handlers]
        users
          use <anonymous>
          get /me [2 handlers]
          patch /updateMe [2 handlers]
          delete /deleteMe [2 handlers]
          use <anonymous>
          get / [2 handlers]
          post / [2 handlers]
          get /:id [2 handlers]
          patch /:id [2 handlers]
          delete /:id [2 handlers]
        auth
          post /signup [3 handlers]
          post /login [3 handlers]
          get /status [1 handlers]
          use <anonymous>
          post /logout [1 handlers]
          patch /updateMyPassword [2 handlers]
        categories
          get / [2 handlers]
          get /:category/products [2 handlers]
          get /:id [2 handlers]
          use <anonymous>
          use <anonymous>
          post / [2 handlers]
          delete|patch /:id [4 handlers]
        products
          get / [2 handlers]
          get /featured [2 handlers]
          get /show-case [2 handlers]
          get /related-products/:id [2 handlers]
          get /:id [2 handlers]
          get /slug/:slug [2 handlers]
          use <anonymous>
          use <anonymous>
          post / [2 handlers]
          delete|patch /:id [4 handlers]
        config
          get / [2 handlers]
          use <anonymous>
          use <anonymous>
          post / [2 handlers]
          patch /:id [2 handlers]
          delete /:id [2 handlers]
        cart
          use <anonymous>
          get / [2 handlers]
          post / [2 handlers]
          post /sync [2 handlers]
          patch /items/:cartItemId [2 handlers]
          delete /items/:cartItemId [2 handlers]
          delete / [2 handlers]
        orders
          use <anonymous>
          post / [3 handlers]
          get / [2 handlers]
          get /:orderId [2 handlers]
          use <anonymous>
          patch /:orderId/status [2 handlers]
          patch /:orderId/payment-status [2 handlers]
        admin
          use <anonymous>
          use <anonymous>
          get /orders [2 handlers]
          get /orders/:orderId [2 handlers]
          get /stats [2 handlers]
      sitemap.xml
        get / [1 handlers]"
    `);
  });
});
