import { CATALOGUE_LOCK, expect, test, type CategoryName } from "./fixtures.js";

// The admin catalogue specs edit a listed product and add a disposable one.
test.describe.configure({ lock: CATALOGUE_LOCK });

const CATEGORIES: CategoryName[] = ["Headphones", "Earphones", "Speakers"];

for (const category of CATEGORIES) {
  test(`the ${category} page lists that category's products`, async ({
    page,
    catalogue,
  }) => {
    const products = await catalogue.productsByCategory(category);
    expect(products.length).toBeGreaterThan(0);

    await page.goto(`/category/${category}`);

    await expect(
      page.getByRole("heading", { name: category, level: 1 }),
    ).toBeVisible();
    await expect(page.getByRole("article")).toHaveCount(products.length);

    for (const product of products) {
      const card = page.getByRole("article").filter({
        has: page.getByRole("heading", { name: product.fullLabel.join(" ") }),
      });
      await expect(card.getByRole("link")).toHaveAttribute(
        "href",
        `/product/${product.slug}`,
      );
      await expect(card.getByText("new product")).toHaveCount(
        product.isNewProduct ? 1 : 0,
      );
    }
  });
}
