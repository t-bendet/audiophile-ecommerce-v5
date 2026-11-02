import type { Page } from "@playwright/test";
import {
  ADMIN_STORAGE_STATE,
  ORDERS_LOCK,
  expect,
  test,
  type StatsPeriod,
} from "./fixtures.js";

// A stat card prints one number: a count as `1,234`, revenue as `$ 1,234`.
const statValue = (page: Page, label: string) =>
  page.getByRole("region", { name: label, exact: true }).getByRole("paragraph");

const readNumber = async (page: Page, label: string) =>
  Number((await statValue(page, label).innerText()).replace(/[^\d]/g, ""));

const shownCount = (count: number) => count.toLocaleString("en-US");
const shownMoney = (amount: number) => `$ ${shownCount(amount)}`;

const periodTab = (page: Page, label: string) =>
  page.getByRole("tablist", { name: "Period" }).getByRole("tab", {
    name: label,
  });

// The counts are the whole shop's, so a test holds the orders lock and expects
// exactly its own order on top of what it read before placing it.
test.describe("an admin reading the stats", () => {
  test.describe.configure({ lock: ORDERS_LOCK });
  test.use({ storageState: ADMIN_STORAGE_STATE });

  test("counts a fresh shopper's paid order in the week's stats", async ({
    page,
    admin,
    placeOrderAsFreshShopper,
  }) => {
    await page.goto("/admin/stats?period=7d");
    await expect(periodTab(page, "7 days")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(
      page.getByRole("region", { name: "Orders by status" }),
    ).toBeVisible();
    const before = {
      orders: await readNumber(page, "Orders"),
      revenue: await readNumber(page, "Revenue"),
    };

    const { orderId } = await placeOrderAsFreshShopper();
    // Paid by the admin through the API, the way the fulfilment form does it.
    const { total } = await admin.setPaymentStatus(orderId, "PAID");

    await page.goto("/admin/stats?period=7d");
    await expect(statValue(page, "Orders")).toHaveText(
      shownCount(before.orders + 1),
    );
    await expect(statValue(page, "Revenue")).toHaveText(
      shownMoney(before.revenue + total),
    );
    await expect(
      page.getByRole("region", { name: "Best sellers" }).getByRole("link"),
    ).not.toHaveCount(0);
  });

  test("counts a fresh shopper's paid order in the longer periods' stats", async ({
    page,
    admin,
    placeOrderAsFreshShopper,
  }) => {
    const periods: { period: StatsPeriod; label: string }[] = [
      { period: "30d", label: "30 days" },
      { period: "90d", label: "90 days" },
      { period: "all", label: "All time" },
    ];
    const before = await Promise.all(
      periods.map(({ period }) => admin.stats(period)),
    );

    const { orderId } = await placeOrderAsFreshShopper();
    const { total } = await admin.setPaymentStatus(orderId, "PAID");

    // Thirty days is the page's default period; the others are a tab away.
    await page.goto("/admin/stats");
    for (const [index, { period, label }] of periods.entries()) {
      if (index > 0) {
        await periodTab(page, label).click();
        await expect(page).toHaveURL(`/admin/stats?period=${period}`);
      }
      await expect(periodTab(page, label)).toHaveAttribute(
        "aria-selected",
        "true",
      );
      await expect(statValue(page, "Orders")).toHaveText(
        shownCount(before[index].ordersCount + 1),
      );
      await expect(statValue(page, "Revenue")).toHaveText(
        shownMoney(before[index].revenue + total),
      );
    }
  });
});
