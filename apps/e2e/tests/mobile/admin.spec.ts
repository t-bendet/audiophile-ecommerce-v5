import { ADMIN_STORAGE_STATE, expect, test } from "../fixtures.js";

test.use({ storageState: ADMIN_STORAGE_STATE });

const SECTIONS = [
  { label: "Orders", url: "/admin/orders" },
  { label: "Users", url: "/admin/users" },
  { label: "Products", url: "/admin/products" },
  { label: "Homepage", url: "/admin/homepage" },
  { label: "Stats", url: "/admin/stats" },
];

test("the admin tab bar moves between every section", async ({ page }) => {
  await page.goto("/admin");

  // The sidebar is the same navigation, hidden on a phone along with its way
  // back to the storefront, so the one left is the tab bar.
  const tabBar = page.getByRole("navigation", { name: "Admin sections" });
  await expect(tabBar).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Storefront" })).toBeHidden();
  await expect(tabBar.getByRole("link")).toHaveText(
    SECTIONS.map(({ label }) => label),
  );

  for (const { label, url } of SECTIONS) {
    const entry = tabBar.getByRole("link", { name: label });
    await entry.tap();

    await expect(page).toHaveURL(url);
    await expect(
      page.getByRole("heading", { name: label, level: 1 }),
    ).toBeVisible();
    await expect(entry).toHaveAttribute("aria-current", "page");
  }
});
