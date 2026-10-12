import { expect, test } from "./fixtures.js";

// The Playwright agents run this one test to put a page in front of themselves.
test("seed", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Open cart" })).toBeVisible();
});
