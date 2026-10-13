import { expect, test } from "../fixtures.js";

test.describe("Mini-cart quantity", () => {
  test("Decrement cannot go below 1", async ({
    page,
    signUpFreshShopper,
    catalogue,
  }) => {
    // 1. Sign up a fresh shopper, add the first catalogue product and open the mini-cart
    await signUpFreshShopper();
    const [product] = await catalogue.products();

    await page.goto(`/product/${product.slug}`);
    await page.getByRole("button", { name: "add to cart" }).click();
    await page.getByRole("button", { name: "Open cart" }).click();

    const miniCart = page.getByRole("dialog");
    const decrease = miniCart.getByRole("button", {
      name: "Decrease quantity",
    });
    const increase = miniCart.getByRole("button", {
      name: "Increase quantity",
    });
    const quantityControl = decrease.locator("..");
    const cartHeading = miniCart.getByRole("heading", {
      name: product.cartLabel,
      exact: true,
    });
    // Matches currencyFormatter in apps/client/src/utils/formatters.ts
    const price = `$ ${product.price.toLocaleString("en-US")}`;

    await expect(cartHeading).toBeVisible();
    await expect(decrease).toBeDisabled();

    // 2. Increase once, then decrease once
    await increase.click();
    await expect(quantityControl.getByText("2", { exact: true })).toBeVisible();
    await expect(decrease).toBeEnabled();

    await decrease.click();
    await expect(decrease).toBeDisabled();
    await expect(quantityControl.getByText("1", { exact: true })).toBeVisible();
    await expect(miniCart.getByText("Subtotal").locator("..")).toContainText(
      price,
    );
    await expect(cartHeading).toBeVisible();
  });
});
