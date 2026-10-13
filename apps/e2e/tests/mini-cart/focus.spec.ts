import { expect, test } from "../fixtures.js";

test.use({ storageState: { cookies: [], origins: [] } });

test("opening the mini-cart moves focus into it and closing returns it to the cart button", async ({
  page,
  catalogue,
}) => {
  const consoleMessages: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "warning" || message.type() === "error") {
      consoleMessages.push(message.text());
    }
  });

  // Chromium only reports a blocked aria-hidden while its accessibility tree is on.
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Accessibility.enable");

  const [product] = await catalogue.products();
  const cartButton = page.getByRole("button", { name: "Open cart" });

  await page.goto(`/product/${product.slug}`);
  await page.getByRole("button", { name: "add to cart" }).click();
  await expect(cartButton).toHaveText("1");
  await cartButton.click();

  const miniCart = page.getByRole("dialog");
  await expect(
    miniCart.getByRole("heading", { name: product.cartLabel, exact: true }),
  ).toBeVisible();
  // Flushes pending accessibility updates, which is when the warning is logged.
  await cdp.send("Accessibility.getFullAXTree");
  expect(
    consoleMessages.filter((text) => text.includes("Blocked aria-hidden")),
  ).toEqual([]);
  await expect(page.locator("[role='dialog']:focus-within")).toHaveCount(1);
  await expect(page.getByLabel("Open cart")).not.toBeFocused();
  await expect(cartButton).toHaveCount(0);

  await page.keyboard.press("Escape");
  await expect(miniCart).toBeHidden();
  await expect(cartButton).toBeFocused();
});
