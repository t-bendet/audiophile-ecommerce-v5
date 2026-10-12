import type { Page } from "@playwright/test";
import { expect, test, type Shopper } from "./fixtures.js";

test.use({ storageState: { cookies: [], origins: [] } });

const signInThroughForm = async (page: Page, shopper: Shopper) => {
  await page.getByLabel("Email").fill(shopper.email);
  await page.getByLabel("Password", { exact: true }).fill(shopper.password);
  await page.getByRole("button", { name: "Login" }).click();
};

test("opening checkout signed out lands back on checkout after login", async ({
  page,
  context,
  signUpFreshShopper,
}) => {
  const shopper = await signUpFreshShopper();
  await context.clearCookies();

  await page.goto("/checkout");

  await expect(page).toHaveURL("/auth/login?redirectTo=%2Fcheckout");
  await signInThroughForm(page, shopper);

  await expect(page).toHaveURL("/checkout");
  await expect(
    page.getByRole("heading", { name: "Your cart is empty" }),
  ).toBeVisible();
});

test("a guest cart survives signing in", async ({
  page,
  context,
  catalogue,
  signUpFreshShopper,
}) => {
  const shopper = await signUpFreshShopper();
  await context.clearCookies();
  const [product] = await catalogue.products();

  await page.goto(`/product/${product.slug}`);
  await page.getByRole("button", { name: "add to cart" }).click();
  await page.getByRole("button", { name: "Open cart" }).click();
  await page.getByRole("link", { name: "Go to Checkout" }).click();

  await expect(page).toHaveURL("/auth/login?redirectTo=%2Fcheckout");
  await signInThroughForm(page, shopper);

  await expect(page).toHaveURL("/checkout");
  await expect(
    page.getByRole("heading", { name: product.cartLabel, exact: true }),
  ).toBeVisible();
});
