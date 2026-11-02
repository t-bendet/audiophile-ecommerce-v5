import { describe, expect, it } from "vitest";
import {
  hasActiveFilters,
  readOrderFilters,
  toSearchParams,
} from "../src/features/admin/orders/filters";
import {
  latestStatuses,
  orderStatusOptions,
  paymentStatusOptions,
  refundMayBeDue,
} from "../src/features/admin/orders/transitions";

// The two selects on the order detail offer exactly what the domain tables
// allow, so the server never has to refuse a move the dashboard offered.
describe("fulfilment select options", () => {
  it("offers the current order status and its allowed moves only", () => {
    expect(orderStatusOptions("PENDING")).toEqual([
      "PENDING",
      "PROCESSING",
      "CANCELLED",
    ]);
    expect(orderStatusOptions("PROCESSING")).not.toContain("PENDING");
    expect(orderStatusOptions("CANCELLED")).toEqual(["CANCELLED"]);
  });

  it("offers the current payment status and its allowed moves only", () => {
    expect(paymentStatusOptions("PENDING")).toEqual([
      "PENDING",
      "PAID",
      "FAILED",
    ]);
    expect(paymentStatusOptions("REFUNDED")).toEqual(["REFUNDED"]);
  });

  it("reminds the owner of a refund only when cancelling a paid order", () => {
    expect(refundMayBeDue({ paymentStatus: "PAID" }, "CANCELLED")).toBe(true);
    expect(refundMayBeDue({ paymentStatus: "PENDING" }, "CANCELLED")).toBe(
      false,
    );
    expect(refundMayBeDue({ paymentStatus: "PAID" }, "SHIPPED")).toBe(false);
  });
});

// A save answers the updated order before the refetched one arrives; the form
// rebases on whichever is newer, so its selects never step back meanwhile.
describe("fulfilment statuses after a save", () => {
  const before = {
    status: "PENDING",
    paymentStatus: "PENDING",
    updatedAt: new Date("2026-01-01T10:00:00.000Z"),
  } as const;
  const saved = {
    status: "PROCESSING",
    paymentStatus: "PAID",
    updatedAt: new Date("2026-01-01T10:00:05.000Z"),
  } as const;

  it("starts from the order the page received", () => {
    expect(latestStatuses(before, undefined)).toBe(before);
  });

  it("keeps the saved order while the refetch is in flight", () => {
    expect(latestStatuses(before, saved)).toBe(saved);
  });

  it("follows the refetched order once it has caught up or moved on", () => {
    const refetched = { ...saved };
    expect(latestStatuses(refetched, saved)).toBe(refetched);

    const movedOn = {
      status: "SHIPPED",
      paymentStatus: "PAID",
      updatedAt: new Date("2026-01-01T10:01:00.000Z"),
    } as const;
    expect(latestStatuses(movedOn, saved)).toBe(movedOn);
  });
});

describe("order list filters in the URL", () => {
  it("keeps valid filters and drops what the server would reject", () => {
    const params = new URLSearchParams(
      "status=SHIPPED&paymentStatus=LOST&customerEmail=ada&orderId=short&page=2",
    );

    expect(readOrderFilters(params)).toEqual({
      status: "SHIPPED",
      customerEmail: "ada",
      page: 2,
    });
  });

  it("writes only named values and leaves the first page implicit", () => {
    const params = toSearchParams({ status: "PENDING", page: 1 });

    expect(params.toString()).toBe("status=PENDING");
    expect(hasActiveFilters({ page: 3 })).toBe(false);
    expect(hasActiveFilters({ customerEmail: "ada" })).toBe(true);
  });
});
