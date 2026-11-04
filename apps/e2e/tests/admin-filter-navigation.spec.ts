import { ADMIN_STORAGE_STATE, expect, holdRoute, test } from "./fixtures.js";

test.use({ storageState: ADMIN_STORAGE_STATE });

for (const {
  section,
  searchLabel,
  request,
  selectLabel,
  option,
  applied,
  emptyMessage,
} of [
  {
    section: "orders",
    searchLabel: "Customer email",
    request: "**/api/v1/admin/orders?*customerEmail=*",
    selectLabel: "Status",
    option: "Processing",
    applied: /status=PROCESSING/,
    emptyMessage: "No order matches these filters.",
  },
  {
    section: "users",
    searchLabel: "Search",
    request: "**/api/v1/users?*search=*",
    selectLabel: "Role",
    option: "Admin",
    applied: /role=ADMIN/,
    emptyMessage: "No user matches these filters.",
  },
]) {
  test(`keeps the ${section} select open when an applied filter finishes loading`, async ({
    page,
  }) => {
    await page.goto(`/admin/${section}`);
    const filters = page.getByRole("form", { name: `Filter ${section}` });
    const release = await holdRoute(page, request);

    try {
      await filters
        .getByLabel(searchLabel)
        .fill("no-match-filter@example.invalid");
      await filters.getByRole("button", { name: "Apply" }).click();
      await filters.getByLabel(selectLabel, { exact: true }).click();
      await expect(
        page.getByRole("option", { name: option, exact: true }),
      ).toBeVisible();
      release();

      await expect(page.getByText(emptyMessage, { exact: true })).toBeVisible();
      await page.getByRole("option", { name: option, exact: true }).click();
      await expect(filters.getByLabel(selectLabel, { exact: true })).toHaveText(
        option,
      );
      await filters.getByRole("button", { name: "Apply" }).click();
      await expect(page).toHaveURL(applied);
    } finally {
      release();
    }
  });
}

test("resets order filter drafts and validation on Clear filters and browser history", async ({
  page,
}) => {
  const orderId = "000000000000000000000000";
  const email = "no-match-filter@example.invalid";
  await page.goto(
    `/admin/orders?orderId=${orderId}&customerEmail=${email}&status=PROCESSING&paymentStatus=PAID`,
  );
  const filters = page.getByRole("form", { name: "Filter orders" });
  const id = filters.getByLabel("Order id", { exact: true });
  const customerEmail = filters.getByLabel("Customer email");
  const status = filters.getByLabel("Status", { exact: true });
  const payment = filters.getByLabel("Payment status", { exact: true });
  const error = filters.getByText("An order id is 24 characters long");

  await id.fill("invalid");
  await customerEmail.fill("unsaved@example.invalid");
  await filters.getByRole("button", { name: "Apply" }).click();
  await expect(error).toBeVisible();
  await page.getByRole("link", { name: "Clear filters" }).click();
  await expect(id).toHaveValue("");
  await expect(customerEmail).toHaveValue("");
  await expect(status).toHaveText("Any status");
  await expect(payment).toHaveText("Any payment");
  await expect(error).toHaveCount(0);

  await page.goBack();
  await expect(id).toHaveValue(orderId);
  await expect(customerEmail).toHaveValue(email);
  await expect(status).toHaveText("Processing");
  await expect(payment).toHaveText("Paid");

  await id.fill("invalid again");
  await filters.getByRole("button", { name: "Apply" }).click();
  await expect(error).toBeVisible();
  await page.goForward();
  await expect(id).toHaveValue("");
  await expect(customerEmail).toHaveValue("");
  await expect(status).toHaveText("Any status");
  await expect(payment).toHaveText("Any payment");
  await expect(error).toHaveCount(0);
});

test("resets user filter drafts on Clear filters and browser history", async ({
  page,
}) => {
  const searchText = "no-match-filter@example.invalid";
  await page.goto(`/admin/users?search=${searchText}&role=ADMIN&active=false`);
  const filters = page.getByRole("form", { name: "Filter users" });
  const search = filters.getByLabel("Search");
  const role = filters.getByLabel("Role");
  const active = filters.getByLabel("Active");

  await search.fill("unsaved@example.invalid");
  await page.getByRole("link", { name: "Clear filters" }).click();
  await expect(search).toHaveValue("");
  await expect(role).toHaveText("Any role");
  await expect(active).toHaveText("Any state");

  await page.goBack();
  await expect(search).toHaveValue(searchText);
  await expect(role).toHaveText("Admin");
  await expect(active).toHaveText("Deactivated");

  await search.fill("another-unsaved@example.invalid");
  await page.goForward();
  await expect(search).toHaveValue("");
  await expect(role).toHaveText("Any role");
  await expect(active).toHaveText("Any state");
});
