import { expect, test } from "./fixtures.js";

test("a category page lists that category's products", async ({
  page,
  catalogue,
}) => {
  const products = await catalogue.productsByCategory("Headphones");
  expect(products.length).toBeGreaterThan(0);

  await page.goto("/category/Headphones");

  await expect(
    page.getByRole("heading", { name: "Headphones", level: 1 }),
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
  }
});
