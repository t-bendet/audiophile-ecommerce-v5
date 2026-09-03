import { ErrorCode } from "@repo/domain";
import { beforeEach, describe, expect, it } from "vitest";
import { cartService } from "../src/services/cart.service.js";
import { orderService } from "../src/services/order.service.js";
import {
  createProduct,
  createUser,
  resetDatabase,
} from "./helpers/database.js";

// The route tests cover the same guarantee through HTTP; these pin it to the
// services themselves, which any non-route caller reaches directly.

const checkout = {
  shippingAddress: {
    fullName: "Ada Lovelace",
    email: "ada@example.com",
    phone: "555-0100",
    address: "1 Analytical Way",
    city: "London",
    state: "London",
    zipCode: "E1 6AN",
    country: "UK",
  },
  billingAddress: {
    fullName: "Ada Lovelace",
    address: "1 Analytical Way",
    city: "London",
    state: "London",
    zipCode: "E1 6AN",
    country: "UK",
  },
  paymentMethod: "e-Money",
};

const cartItemOf = async (userId: string) => {
  const product = await createProduct({ price: 100 });
  const cart = await cartService.addToCart(userId, product.id, 1);
  return cart.items[0]!;
};

const orderOf = async (userId: string) => {
  await cartItemOf(userId);
  return orderService.createOrder(userId, checkout);
};

beforeEach(resetDatabase);

describe("CartService ownership", () => {
  it("refuses to update another user's cart item", async () => {
    const owner = await createUser();
    const intruder = await createUser();
    const item = await cartItemOf(owner.id);

    await expect(
      cartService.updateCartItem(intruder.id, item.id, 5),
    ).rejects.toMatchObject({
      code: ErrorCode.FORBIDDEN,
      statusCode: 403,
    });

    const cart = await cartService.getOrCreateCart(owner.id);
    expect(cart.items).toMatchObject([{ id: item.id, quantity: 1 }]);
  });

  it("refuses to remove another user's cart item", async () => {
    const owner = await createUser();
    const intruder = await createUser();
    const item = await cartItemOf(owner.id);

    await expect(
      cartService.removeFromCart(intruder.id, item.id),
    ).rejects.toMatchObject({
      code: ErrorCode.FORBIDDEN,
      statusCode: 403,
    });

    const cart = await cartService.getOrCreateCart(owner.id);
    expect(cart.items).toMatchObject([{ id: item.id }]);
  });
});

describe("OrderService ownership", () => {
  it("refuses to read another user's order", async () => {
    const owner = await createUser();
    const intruder = await createUser();
    const order = await orderOf(owner.id);

    await expect(
      orderService.getOrderById(intruder.id, order.id),
    ).rejects.toMatchObject({
      code: ErrorCode.FORBIDDEN,
      statusCode: 403,
    });

    await expect(
      orderService.getOrderById(owner.id, order.id),
    ).resolves.toMatchObject({ id: order.id, userId: owner.id });
  });
});
