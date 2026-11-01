import { describe, expect, it } from "vitest";
import {
  hasActiveFilters,
  readOrderFilters,
  toSearchParams,
} from "../src/features/admin/orders/filters";
import {
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
