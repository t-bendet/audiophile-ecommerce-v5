import { expect, test } from "./fixtures.js";

test.use({ storageState: { cookies: [], origins: [] } });

test("adding a product on its page updates the guest mini-cart", async ({
  page,
  catalogue,
}) => {
  const [product] = await catalogue.products();
  const cartButton = page.getByRole("button", { name: "Open cart" });

  await page.goto(`/product/${product.slug}`);
  await page.getByRole("button", { name: "Increase quantity" }).click();
  await page.getByRole("button", { name: "add to cart" }).click();

  await expect(cartButton).toHaveText("2");
  await cartButton.click();

  const miniCart = page.getByRole("dialog");
  await expect(miniCart.getByText("cart (2)")).toBeVisible();
  await expect(
    miniCart.getByRole("heading", { name: product.cartLabel, exact: true }),
  ).toBeVisible();
});
