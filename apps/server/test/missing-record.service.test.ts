import { ErrorCode } from "@repo/domain";
import { beforeEach, describe, expect, it } from "vitest";
import { cartService } from "../src/services/cart.service.js";
import { categoryService } from "../src/services/category.service.js";
import { orderService } from "../src/services/order.service.js";
import { ABSENT_ID, resetDatabase } from "./helpers/database.js";

// Prisma raises P2023 for this, so it stands in for "a failure that is not a
// missing row" without mocking the client out.
const MALFORMED_ID = "not-an-object-id";

beforeEach(resetDatabase);

describe("a missing row on delete", () => {
  it("becomes a NOT_FOUND for a service that guards P2025", async () => {
    await expect(categoryService.delete(ABSENT_ID)).rejects.toMatchObject({
      code: ErrorCode.NOT_FOUND,
    });
  });

  it("becomes a NOT_FOUND for orders", async () => {
    await expect(orderService.delete(ABSENT_ID)).rejects.toMatchObject({
      code: ErrorCode.NOT_FOUND,
    });
  });

  it("becomes a NOT_FOUND for carts", async () => {
    await expect(cartService.delete(ABSENT_ID)).rejects.toMatchObject({
      code: ErrorCode.NOT_FOUND,
    });
  });
});

describe("any other failure on delete", () => {
  it("propagates from a category delete", async () => {
    await expect(categoryService.delete(MALFORMED_ID)).rejects.toMatchObject({
      code: "P2023",
    });
  });

  it("propagates from an order delete", async () => {
    await expect(orderService.delete(MALFORMED_ID)).rejects.toMatchObject({
      code: "P2023",
    });
  });

  it("propagates from a cart delete", async () => {
    await expect(cartService.delete(MALFORMED_ID)).rejects.toMatchObject({
      code: "P2023",
    });
  });
});

describe("a missing row on update", () => {
  it("becomes a NOT_FOUND for a service that guards P2025", async () => {
    await expect(
      categoryService.update(ABSENT_ID, { name: "Speakers" }),
    ).rejects.toMatchObject({ code: ErrorCode.NOT_FOUND });
  });

  it("becomes a NOT_FOUND for orders", async () => {
    await expect(
      orderService.update(ABSENT_ID, { status: "SHIPPED" }),
    ).rejects.toMatchObject({ code: ErrorCode.NOT_FOUND });
  });

  it("becomes a NOT_FOUND for carts", async () => {
    await expect(
      cartService.update(ABSENT_ID, { v: 1 }),
    ).rejects.toMatchObject({ code: ErrorCode.NOT_FOUND });
  });

  it("propagates any other failure", async () => {
    await expect(
      categoryService.update(MALFORMED_ID, { name: "Speakers" }),
    ).rejects.toMatchObject({ code: "P2023" });
  });
});
