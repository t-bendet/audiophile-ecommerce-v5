import { expect, test, type CategoryName } from "../fixtures.js";

const CATEGORIES: CategoryName[] = ["Headphones", "Earphones", "Speakers"];

test("the menu lists the categories and closes on the way to one", async ({
  page,
}) => {
  const menuButton = page.getByRole("button", { name: "Open main menu" });
  const menu = page.getByRole("dialog", { name: "Main menu" });
  const categoryLink = (category: CategoryName) =>
    menu.getByRole("listitem").filter({ hasText: category }).getByRole("link");

  await page.goto("/");
  await menuButton.tap();

  await expect(menu).toBeVisible();
  // The phone's nav bar is 5.5rem: the sheet and its overlay start under it.
  await expect(page.getByTestId("dialog-overlay")).toHaveCSS("top", "88px");
  await expect(menu).toHaveCSS("top", "88px");
  await expect(menu.getByRole("link")).toHaveCount(CATEGORIES.length);
  for (const category of CATEGORIES) {
    await expect(categoryLink(category)).toBeVisible();
  }

  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(menuButton).toBeFocused();
  await menuButton.tap();
  await page.getByTestId("dialog-overlay").tap({ position: { x: 5, y: 500 } });
  await expect(menu).toBeHidden();
  await expect(menuButton).toBeFocused();
  await menuButton.tap();
  await categoryLink("Speakers").tap();

  await expect(page).toHaveURL("/category/Speakers");
  await expect(
    page.getByRole("heading", { name: "Speakers", level: 1 }),
  ).toBeVisible();
  await expect(menu).toBeHidden();
  await expect(menuButton).toBeVisible();
});

test.describe("a guest", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("opens the mini-cart and closes it again", async ({
    page,
    catalogue,
  }) => {
    const [product] = await catalogue.products();
    const cartButton = page.getByRole("button", { name: "Open cart" });

    await page.goto(`/product/${product.slug}`);
    await page.getByRole("button", { name: "add to cart" }).tap();
    await expect(cartButton).toHaveText("1");
    await cartButton.tap();

    const miniCart = page.getByRole("dialog", { name: "cart (1)" });
    await expect(
      miniCart.getByRole("heading", { name: product.cartLabel, exact: true }),
    ).toBeVisible();
    // The panel sits 1.5rem under the 5.5rem nav bar; its overlay starts at the nav.
    await expect(page.getByTestId("dialog-overlay")).toHaveCSS("top", "88px");
    await expect(miniCart).toHaveCSS("top", "112px");

    await miniCart.getByRole("button", { name: "Continue Shopping" }).tap();
    await expect(miniCart).toBeHidden();
    await expect(cartButton).toBeVisible();
    await expect(page).toHaveURL(`/product/${product.slug}`);
  });
});

test("account navigation fits on a phone", async ({ page }) => {
  await page.goto("/account/orders");
  const nav = page.getByRole("navigation", { name: "Account" });
  const links = nav.getByRole("link");
  await expect(links).toHaveCount(3);
  const navBox = await nav.boundingBox();
  expect(navBox).not.toBeNull();
  for (const name of ["Profile", "Security", "Orders"]) {
    const link = nav.getByRole("link", { name });
    await expect(link).toBeVisible();
    const box = await link.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(navBox!.x);
    expect(box!.x + box!.width).toBeLessThanOrEqual(navBox!.x + navBox!.width);
  }
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(
    await page.evaluate(() => document.documentElement.clientWidth),
  );
});
