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
