import { expect, test } from "../fixtures.js";

test.describe("Mini-cart quantity", () => {
  test("Signed-in shopper adds, increases, decreases, removes and reaches empty cart", async ({
    page,
    signUpFreshShopper,
  }) => {
    await signUpFreshShopper();
    await page.goto("/product/zx9-speaker");

    const cartButton = page.getByRole("button", { name: "Open cart" });
    // The open dialog makes the header inert, so the badge is read by attribute
    const cartBadge = page.locator('button[aria-label="Open cart"]');

    await expect(
      page.getByRole("heading", { name: "ZX9 Speaker" }),
    ).toBeVisible();
    await expect(page.getByText("$ 4,500")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Decrease quantity" }),
    ).toBeDisabled();
    await expect(page.getByText("1", { exact: true })).toBeVisible();
    await expect(cartButton).toHaveText("");

    await page.getByRole("button", { name: "add to cart" }).click();
    await expect(cartButton).toHaveText("1");

    await cartButton.click();

    const miniCart = page.getByRole("dialog");
    const decrease = miniCart.getByRole("button", {
      name: "Decrease quantity",
    });
    const increase = miniCart.getByRole("button", {
      name: "Increase quantity",
    });
    const remove = miniCart.getByRole("button", { name: "Remove item" });

    await expect(miniCart.getByText("cart (1)")).toBeVisible();
    await expect(
      miniCart.getByRole("heading", { name: "ZX9", level: 3 }),
    ).toBeVisible();
    await expect(miniCart.getByText("$ 4,500")).toHaveCount(2);
    await expect(miniCart.getByText("1", { exact: true })).toBeVisible();
    await expect(miniCart.getByText("Subtotal")).toBeVisible();
    await expect(decrease).toBeDisabled();
    await expect(increase).toBeEnabled();
    await expect(remove).toBeEnabled();
    await expect(
      miniCart.getByRole("button", { name: "Go to Checkout" }),
    ).toBeVisible();
    await expect(
      miniCart.getByRole("button", { name: "Continue Shopping" }),
    ).toBeVisible();

    await increase.click();
    await expect(miniCart.getByText("cart (2)")).toBeVisible();
    await expect(miniCart.getByText("2", { exact: true })).toBeVisible();
    await expect(miniCart.getByText("$ 9,000")).toBeVisible();
    await expect(decrease).toBeEnabled();
    await expect(cartBadge).toHaveText("2");

    await decrease.click();
    await expect(miniCart.getByText("cart (1)")).toBeVisible();
    await expect(miniCart.getByText("1", { exact: true })).toBeVisible();
    await expect(miniCart.getByText("$ 4,500")).toHaveCount(2);
    await expect(decrease).toBeDisabled();

    await remove.click();
    await expect(miniCart.getByText("cart (0)")).toBeVisible();
    await expect(miniCart.getByText("Your cart is empty")).toBeVisible();
    await expect(miniCart.getByText("Add items to get started")).toBeVisible();
    await expect(miniCart.getByRole("heading", { level: 3 })).toHaveCount(0);
    await expect(
      miniCart.getByRole("button", { name: "Go to Checkout" }),
    ).toHaveCount(0);
    await expect(miniCart.getByText("Subtotal")).toHaveCount(0);
    await expect(cartBadge).toHaveText("");
  });
});
