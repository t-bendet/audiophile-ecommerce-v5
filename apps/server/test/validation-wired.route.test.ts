import { ErrorCode, getStatusCode, UserPublicInfo } from "@repo/domain";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import app from "../src/app.js";
import { authService } from "../src/services/auth.service.js";

// Every schema-guarded route, sent an input its own schema must reject. The
// asserted `details[].path` proves the *right* schema ran, not merely one.

const VALIDATION_STATUS = getStatusCode(ErrorCode.VALIDATION_ERROR);

const ADMIN: UserPublicInfo = {
  id: "0123456789abcdef01234567",
  name: "Test Admin",
  email: "admin@example.com",
  role: "ADMIN",
};

const BAD_ID = "not-an-id";
const UNEXPECTED_BODY = { unexpected: true };

type Case = {
  route: string;
  send: () => request.Test;
  path: string[];
};

const cases: Case[] = [
  // products
  {
    route: "GET /products",
    send: () => request(app).get("/api/v1/products?limit=abc"),
    path: ["query", "limit"],
  },
  {
    route: "GET /products/featured",
    send: () =>
      request(app).get("/api/v1/products/featured").send(UNEXPECTED_BODY),
    path: ["body"],
  },
  {
    route: "GET /products/show-case",
    send: () =>
      request(app).get("/api/v1/products/show-case").send(UNEXPECTED_BODY),
    path: ["body"],
  },
  {
    route: "GET /products/related-products/:id",
    send: () => request(app).get(`/api/v1/products/related-products/${BAD_ID}`),
    path: ["params", "id"],
  },
  {
    route: "GET /products/:id",
    send: () => request(app).get(`/api/v1/products/${BAD_ID}`),
    path: ["params", "id"],
  },
  {
    route: "GET /products/slug/:slug",
    send: () => request(app).get("/api/v1/products/slug/a"),
    path: ["params", "slug"],
  },
  {
    route: "POST /products",
    send: () => request(app).post("/api/v1/products").send({}),
    path: ["body", "cartLabel"],
  },
  {
    route: "PATCH /products/:id",
    send: () => request(app).patch(`/api/v1/products/${BAD_ID}`).send({}),
    path: ["params", "id"],
  },
  {
    route: "DELETE /products/:id",
    send: () => request(app).delete(`/api/v1/products/${BAD_ID}`),
    path: ["params", "id"],
  },

  // categories
  {
    route: "GET /categories",
    send: () => request(app).get("/api/v1/categories?limit=abc"),
    path: ["query", "limit"],
  },
  {
    route: "GET /categories/:category/products",
    send: () => request(app).get("/api/v1/categories/not-a-category/products"),
    path: ["params", "category"],
  },
  {
    route: "GET /categories/:id",
    send: () => request(app).get(`/api/v1/categories/${BAD_ID}`),
    path: ["params", "id"],
  },
  {
    route: "POST /categories",
    send: () => request(app).post("/api/v1/categories").send({}),
    path: ["body", "name"],
  },
  {
    route: "PATCH /categories/:id",
    send: () => request(app).patch(`/api/v1/categories/${BAD_ID}`).send({}),
    path: ["params", "id"],
  },
  {
    route: "DELETE /categories/:id",
    send: () => request(app).delete(`/api/v1/categories/${BAD_ID}`),
    path: ["params", "id"],
  },

  // config
  {
    route: "GET /config",
    send: () => request(app).get("/api/v1/config").send(UNEXPECTED_BODY),
    path: ["body"],
  },
  {
    route: "POST /config",
    send: () => request(app).post("/api/v1/config").send({}),
    path: ["body", "name"],
  },
  {
    route: "PATCH /config/:id",
    send: () => request(app).patch(`/api/v1/config/${BAD_ID}`).send({}),
    path: ["params", "id"],
  },
  {
    route: "DELETE /config/:id",
    send: () => request(app).delete(`/api/v1/config/${BAD_ID}`),
    path: ["params", "id"],
  },

  // users
  {
    route: "GET /users/me",
    send: () => request(app).get("/api/v1/users/me").send(UNEXPECTED_BODY),
    path: ["body"],
  },
  {
    route: "PATCH /users/updateMe",
    send: () =>
      request(app).patch("/api/v1/users/updateMe").send(UNEXPECTED_BODY),
    path: ["body", "unexpected"],
  },
  {
    route: "DELETE /users/deleteMe",
    send: () =>
      request(app).delete("/api/v1/users/deleteMe").send(UNEXPECTED_BODY),
    path: ["body"],
  },
  {
    route: "GET /users",
    send: () => request(app).get("/api/v1/users?limit=abc"),
    path: ["query", "limit"],
  },
  {
    route: "POST /users",
    send: () => request(app).post("/api/v1/users").send({}),
    path: ["body", "name"],
  },
  {
    route: "GET /users/:id",
    send: () => request(app).get(`/api/v1/users/${BAD_ID}`),
    path: ["params", "id"],
  },
  {
    route: "PATCH /users/:id",
    send: () => request(app).patch(`/api/v1/users/${BAD_ID}`).send({}),
    path: ["params", "id"],
  },
  {
    route: "DELETE /users/:id",
    send: () => request(app).delete(`/api/v1/users/${BAD_ID}`),
    path: ["params", "id"],
  },

  // auth
  {
    route: "POST /auth/signup",
    send: () => request(app).post("/api/v1/auth/signup").send({}),
    path: ["body", "name"],
  },
  {
    route: "POST /auth/login",
    send: () => request(app).post("/api/v1/auth/login").send({}),
    path: ["body", "email"],
  },
  {
    route: "PATCH /auth/updateMyPassword",
    send: () => request(app).patch("/api/v1/auth/updateMyPassword").send({}),
    path: ["body", "currentPassword"],
  },

  // cart
  {
    route: "GET /cart",
    send: () => request(app).get("/api/v1/cart").send(UNEXPECTED_BODY),
    path: ["body"],
  },
  {
    route: "POST /cart",
    send: () => request(app).post("/api/v1/cart").send({}),
    path: ["body", "productId"],
  },
  {
    route: "POST /cart/sync",
    send: () => request(app).post("/api/v1/cart/sync").send({}),
    path: ["body", "items"],
  },
  {
    route: "PATCH /cart/items/:cartItemId",
    send: () => request(app).patch(`/api/v1/cart/items/${BAD_ID}`).send({}),
    path: ["params", "cartItemId"],
  },
  {
    route: "DELETE /cart/items/:cartItemId",
    send: () => request(app).delete(`/api/v1/cart/items/${BAD_ID}`),
    path: ["params", "cartItemId"],
  },
  {
    route: "DELETE /cart",
    send: () => request(app).delete("/api/v1/cart").send(UNEXPECTED_BODY),
    path: ["body"],
  },

  // orders
  {
    route: "POST /orders",
    send: () => request(app).post("/api/v1/orders").send({}),
    path: ["body", "shippingAddress"],
  },
  {
    route: "GET /orders",
    send: () => request(app).get("/api/v1/orders?limit=abc"),
    path: ["query", "limit"],
  },
  {
    route: "GET /orders/:orderId",
    send: () => request(app).get(`/api/v1/orders/${BAD_ID}`),
    path: ["params", "orderId"],
  },
  {
    route: "PATCH /orders/:orderId/status",
    send: () => request(app).patch(`/api/v1/orders/${BAD_ID}/status`).send({}),
    path: ["params", "orderId"],
  },
];

beforeEach(() => {
  vi.spyOn(authService, "validateTokenAndGetUser").mockResolvedValue(ADMIN);
});

describe("every schema-guarded route still runs its schema", () => {
  it.each(cases)("$route", async ({ send, path }) => {
    const res = await send();

    expect(res.status).toBe(VALIDATION_STATUS);
    expect(res.body).toMatchObject({
      success: false,
      data: null,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: VALIDATION_STATUS,
      },
    });
    expect(res.body.error.details).toContainEqual(
      expect.objectContaining({ path }),
    );
  });
});
