import type { Page } from "@playwright/test";
import { ADMIN_STORAGE_STATE, ORDERS_LOCK, expect, test } from "./fixtures.js";

// Every test here places orders, which the stats tests count.
test.describe.configure({ lock: ORDERS_LOCK });

// The orders table names an order by its last eight characters.
const shownOrderId = (orderId: string) => `#${orderId.slice(-8).toUpperCase()}`;

const ordersFilters = (page: Page) =>
  page.getByRole("form", { name: "Filter orders" });

const orderRows = (page: Page) => page.getByRole("table").getByRole("row");

const chooseOption = async (page: Page, label: string, option: string) => {
  await ordersFilters(page).getByLabel(label, { exact: true }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
};

test.describe("an admin listing orders", () => {
  test.use({ storageState: ADMIN_STORAGE_STATE });

  test("narrows a shopper's orders by order status and by payment status", async ({
    page,
    admin,
    placeOrdersAsFreshShopper,
  }) => {
    const {
      shopper,
      orderIds: [processing, paid],
    } = await placeOrdersAsFreshShopper(2);
    await admin.setOrderStatus(processing, "PROCESSING");
    await admin.setPaymentStatus(paid, "PAID");

    await page.goto("/admin/orders");
    const filters = ordersFilters(page);
    const rows = orderRows(page);
    await filters.getByLabel("Customer email").fill(shopper.email);
    await filters.getByRole("button", { name: "Apply" }).click();
    await expect(page).toHaveURL(/customerEmail=/);
    // The header row and both orders.
    await expect(rows).toHaveCount(3);

    await chooseOption(page, "Status", "Processing");
    await filters.getByRole("button", { name: "Apply" }).click();
    await expect(page).toHaveURL(/status=PROCESSING/);
    await expect(rows).toHaveCount(2);
    await expect(rows.last()).toContainText(shownOrderId(processing));
    await expect(rows.last()).toContainText("Processing");

    await chooseOption(page, "Status", "Any status");
    await chooseOption(page, "Payment status", "Paid");
    await filters.getByRole("button", { name: "Apply" }).click();
    await expect(page).toHaveURL(/paymentStatus=PAID/);
    await expect(page).not.toHaveURL(/status=PROCESSING/);
    await expect(rows).toHaveCount(2);
    await expect(rows.last()).toContainText(shownOrderId(paid));
    await expect(rows.last()).toContainText("Paid");
  });

  test("pages through more orders than one page holds", async ({
    page,
    placeOrdersAsFreshShopper,
  }) => {
    // The list shows twenty orders a page.
    const { shopper, orderIds } = await placeOrdersAsFreshShopper(21);
    const oldest = orderIds[0];

    await page.goto("/admin/orders");
    const filters = ordersFilters(page);
    await filters.getByLabel("Customer email").fill(shopper.email);
    await filters.getByRole("button", { name: "Apply" }).click();

    const pagination = page.getByRole("navigation", { name: "Pagination" });
    const prev = pagination.getByRole("button", { name: "Prev" });
    const next = pagination.getByRole("button", { name: "Next" });
    const rows = orderRows(page);
    await expect(pagination).toContainText("Showing 1–20 of 21");
    await expect(rows).toHaveCount(21);
    await expect(prev).toBeDisabled();

    await next.click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page).toHaveURL(/customerEmail=/);
    await expect(pagination).toContainText("Showing 21–21 of 21");
    // Newest first, so the second page holds the first order placed.
    await expect(rows).toHaveCount(2);
    await expect(rows.last()).toContainText(shownOrderId(oldest));
    await expect(next).toBeDisabled();

    await prev.click();
    await expect(page).not.toHaveURL(/page=/);
    await expect(pagination).toContainText("Showing 1–20 of 21");
    await expect(rows).toHaveCount(21);
  });
});

test.describe("an admin cancelling an order", () => {
  test.use({ storageState: ADMIN_STORAGE_STATE });

  test("is reminded of the refund, and then only Refunded is left", async ({
    page,
    admin,
    placeOrderAsFreshShopper,
  }) => {
    const { orderId } = await placeOrderAsFreshShopper();
    await admin.setPaymentStatus(orderId, "PAID");

    await page.goto(`/admin/orders/${orderId}`);
    const fulfilment = page.getByRole("form", { name: "Fulfilment" });
    const moveOrder = fulfilment.getByLabel("Move order to");
    const paymentStatus = fulfilment.getByLabel("Payment status");
    const refundNote = fulfilment.getByRole("note");
    await expect(paymentStatus).toHaveText("Paid");
    await expect(refundNote).toHaveCount(0);

    await moveOrder.click();
    await page.getByRole("option", { name: "Cancelled" }).click();
    await expect(refundNote).toHaveText(
      "This order is paid. Cancelling it may leave a refund due; mark the payment Refunded once it is returned.",
    );
    await fulfilment.getByRole("button", { name: "Save" }).click();

    await expect(
      fulfilment.getByRole("button", { name: "Save" }),
    ).toBeDisabled();
    await expect(moveOrder).toHaveText("Cancelled");
    // A cancelled order has nowhere further to go.
    await expect(moveOrder).toBeDisabled();
    await expect(refundNote).toBeVisible();

    await paymentStatus.click();
    await expect(page.getByRole("option", { name: "Refunded" })).toBeVisible();
    await expect(page.getByRole("option", { name: "Failed" })).toHaveCount(0);
    await expect(page.getByRole("option", { name: "Pending" })).toHaveCount(0);
    await page.keyboard.press("Escape");
  });
});

test.describe("an admin shipping an order", () => {
  test.use({ storageState: ADMIN_STORAGE_STATE });

  test("requires tracking and displays it after shipment", async ({
    page,
    admin,
    placeOrderAsFreshShopper,
  }) => {
    const { orderId } = await placeOrderAsFreshShopper();
    await admin.setOrderStatus(orderId, "PROCESSING");
    await page.goto(`/admin/orders/${orderId}`);
    const fulfilment = page.getByRole("form", { name: "Fulfilment" });
    await fulfilment.getByLabel("Move order to").click();
    await page.getByRole("option", { name: "Shipped" }).click();
    await fulfilment.getByRole("button", { name: "Save" }).click();
    await expect(fulfilment.getByLabel("Carrier")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(fulfilment.getByLabel("Tracking number")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await fulfilment.getByLabel("Carrier").fill("DHL");
    await fulfilment.getByLabel("Tracking number").fill("ABC123");
    await fulfilment.getByRole("button", { name: "Save" }).click();
    await expect(fulfilment.getByText("ABC123")).toBeVisible();
    await expect(fulfilment.getByText("DHL")).toBeVisible();
    await expect(
      fulfilment.getByRole("button", { name: "Copy tracking number" }),
    ).toBeVisible();
  });
});
