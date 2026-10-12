import { expect, test } from "./fixtures.js";

test("an unknown URL shows the not-found page", async ({ page }) => {
  await page.goto("/no-such-page");

  await expect(
    page.getByRole("heading", { name: "404 - Not Found", level: 1 }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Go to Home" })).toBeVisible();
});
