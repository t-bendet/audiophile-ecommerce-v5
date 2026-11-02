import { randomUUID } from "node:crypto";
import type { Page } from "@playwright/test";
import {
  ADMIN_STORAGE_STATE,
  CATALOGUE_LOCK,
  disposableProduct,
  expect,
  test,
  type CatalogueProduct,
  type ProductChanges,
} from "./fixtures.js";

// Every test here changes what the storefront shows, which the home and
// category tests assert against, or reads the slots the last one changes.
test.describe.configure({ lock: CATALOGUE_LOCK });

// The storefront prints a whole-dollar price as `$ 4,500`.
const shownPrice = (price: number) => `$ ${price.toLocaleString("en-US")}`;

// Everything the edit form sends, so a restore undoes a save whole.
const editableFields = (product: CatalogueProduct): ProductChanges => ({
  name: product.name,
  price: product.price,
  categoryId: product.categoryId,
  isNewProduct: product.isNewProduct,
  description: product.description,
  featuresText: product.featuresText,
  includedItems: product.includedItems.map(({ item, quantity }) => ({
    item,
    quantity,
  })),
  cartLabel: product.cartLabel,
  shortLabel: product.shortLabel,
  fullLabel: product.fullLabel,
});

// The product page's own card, found by its headline.
const productCard = (page: Page, fullLabel: string[]) =>
  page.getByRole("article").filter({
    has: page.getByRole("heading", { name: fullLabel.join(" "), exact: true }),
  });

test.describe("an admin editing the catalogue", () => {
  test.use({ storageState: ADMIN_STORAGE_STATE });

  test("changes a product's price and sees it on the storefront", async ({
    page,
    admin,
    catalogue,
  }) => {
    // A product no homepage slot renders, so the home page is untouched.
    const product = await catalogue.productBySlug("xx59-headphones");
    const edited = product.price + 1;

    try {
      await page.goto("/admin/products");
      await page
        .getByRole("table")
        .getByRole("link", { name: product.name })
        .click();

      await expect(page).toHaveURL(`/admin/products/${product.id}`);
      const form = page.getByRole("form", { name: "Edit product" });
      const save = form.getByRole("button", { name: "Save" });
      await expect(save).toBeDisabled();
      await expect(form.getByText(product.slug)).toBeVisible();

      await form.getByLabel("Price", { exact: true }).fill(String(edited));
      await expect(save).toBeEnabled();
      await save.click();
      await expect(save).toBeDisabled();
      await expect(form.getByLabel("Price", { exact: true })).toHaveValue(
        String(edited),
      );

      await page.goto(`/product/${product.slug}`);
      await expect(
        page.getByText(shownPrice(edited), { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText(shownPrice(product.price), { exact: true }),
      ).toHaveCount(0);
    } finally {
      await admin.updateProduct(product.id, { price: product.price });
    }
  });

  test("changes a product's copy, box, headline and new flag and sees them on the storefront", async ({
    page,
    admin,
    catalogue,
  }) => {
    // Like the price test's, a product no homepage slot renders.
    const product = await catalogue.productBySlug("xx99-mark-one-headphones");
    expect(product.isNewProduct).toBe(false);
    const marker = randomUUID().slice(0, 8);
    const description = `Edited by an E2E spec, ${marker}.`;
    const [boxed] = product.includedItems;
    const quantity = boxed.quantity + 1;
    const fullLabel = [...product.fullLabel, marker];

    const form = page.getByRole("form", { name: "Edit product" });
    const newProduct = form
      .getByRole("region", { name: "Basics" })
      .getByLabel("New product");
    const save = form.getByRole("button", { name: "Save" });
    const saved = page.getByText("Product saved");
    const card = productCard(page, fullLabel);
    const overline = card.getByText("new product");

    try {
      await page.goto(`/admin/products/${product.id}`);
      await newProduct.check();
      await form.getByLabel("Description").fill(description);
      await form
        .getByRole("region", { name: "In the box" })
        .getByLabel("Quantity")
        .first()
        .fill(String(quantity));
      await form.getByLabel("Full label").fill(fullLabel.join("\n"));
      await save.click();
      await expect(saved).toBeVisible();
      await expect(save).toBeDisabled();
      await expect(form.getByLabel("Description")).toHaveValue(description);

      await page.goto(`/product/${product.slug}`);
      await expect(card).toBeVisible();
      await expect(overline).toBeVisible();
      await expect(card.getByText(description)).toBeVisible();
      await expect(
        page.getByRole("listitem").filter({ hasText: boxed.item }),
      ).toHaveText(`${quantity}x${boxed.item}`);

      await page.goto(`/admin/products/${product.id}`);
      await newProduct.uncheck();
      await save.click();
      await expect(saved).toBeVisible();
      await expect(save).toBeDisabled();

      await page.goto(`/product/${product.slug}`);
      await expect(card).toBeVisible();
      await expect(overline).toHaveCount(0);
    } finally {
      await admin.updateProduct(product.id, editableFields(product));
    }
  });
});

test.describe("an admin choosing the homepage products", () => {
  test.use({ storageState: ADMIN_STORAGE_STATE });

  test("is offered for each homepage slot only the products with its image", async ({
    page,
    catalogue,
  }) => {
    const [featured, showcase, products] = await Promise.all([
      catalogue.featuredProduct(),
      catalogue.showCaseProducts(),
      catalogue.products(),
    ]);
    const nameOf = (id: string) =>
      products.find((product) => product.id === id)?.name ?? id;
    const cover = showcase.showCaseCover;
    expect(cover).not.toBeNull();

    await page.goto("/admin/homepage");
    const form = page.getByRole("form", { name: "Homepage" });
    await expect(
      form.getByRole("button", { name: "Save homepage" }),
    ).toBeDisabled();

    // The seed has one product with a featured image, so the hero can only
    // be that product and the select says so.
    const featuredSlot = form.getByRole("region", { name: "Featured" });
    await expect(featuredSlot).toContainText(nameOf(featured.id));
    await featuredSlot.getByRole("button", { name: "Change" }).click();
    await featuredSlot.getByLabel("Product").click();
    const featuredOptions = page.getByRole("option");
    await expect(featuredOptions).toHaveCount(1);
    await expect(featuredOptions.first()).toHaveText(nameOf(featured.id));
    await page.keyboard.press("Escape");

    // The three showcase images fill the three showcase slots, so the cover
    // select offers all three and disables the two held elsewhere.
    const coverSlot = form.getByRole("region", { name: "Showcase cover" });
    await expect(coverSlot).toContainText(nameOf(cover!.id));
    await coverSlot.getByRole("button", { name: "Change" }).click();
    await coverSlot.getByLabel("Product").click();
    const coverOptions = page.getByRole("option");
    await expect(coverOptions).toHaveCount(3);
    await expect(
      page.getByRole("option", { name: nameOf(cover!.id) }),
    ).toBeEnabled();
    for (const slot of [showcase.showCaseWide, showcase.showCaseGrid]) {
      await expect(
        page.getByRole("option", { name: nameOf(slot!.id) }),
      ).toBeDisabled();
    }
    await page.keyboard.press("Escape");
    await expect(
      form.getByRole("button", { name: "Save homepage" }),
    ).toBeDisabled();
  });

  test("saves a showcase slot and sees its product on the home page", async ({
    page,
    admin,
    catalogue,
  }) => {
    // The seed has no spare showcase image, so a disposable product borrows
    // the grid product's.
    const [config, showcase] = await Promise.all([
      admin.config(),
      catalogue.showCaseProducts(),
    ]);
    expect(showcase.showCaseGrid).not.toBeNull();
    const grid = await catalogue.productBySlug(showcase.showCaseGrid!.slug);
    const disposable = await admin.createProduct(disposableProduct(grid));

    try {
      await page.goto("/admin/homepage");
      const form = page.getByRole("form", { name: "Homepage" });
      const save = form.getByRole("button", { name: "Save homepage" });
      const gridSlot = form.getByRole("region", { name: "Showcase grid" });
      await expect(gridSlot).toContainText(grid.name);

      await gridSlot.getByRole("button", { name: "Change" }).click();
      await gridSlot.getByLabel("Product").click();
      await page
        .getByRole("option", { name: disposable.name, exact: true })
        .click();
      await save.click();
      await expect(page.getByText("Homepage saved")).toBeVisible();
      await expect(save).toBeDisabled();
      await expect(gridSlot).toContainText(disposable.name);

      await page.goto("/");
      await expect(
        page.getByRole("heading", {
          name: disposable.shortLabel,
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: grid.shortLabel, exact: true }),
      ).toHaveCount(0);
    } finally {
      // The slot first: a product a slot holds cannot be deleted.
      await admin.updateConfig(config.id, {
        showCaseGridId: config.showCaseGridId,
      });
      await admin.deleteProduct(disposable.id);
    }
  });
});
