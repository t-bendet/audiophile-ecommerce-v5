import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures.js";

type JsonLd = {
  "@context": string;
  "@type": string;
  sku?: string;
  offers?: { price: number; priceCurrency: string };
};

const jsonLdScript = (page: Page) =>
  page.locator('script[type="application/ld+json"]');

const readJsonLd = async (page: Page): Promise<JsonLd> =>
  JSON.parse((await jsonLdScript(page).textContent()) ?? "") as JsonLd;

test("a product page carries its schema.org Product as JSON-LD", async ({
  page,
  catalogue,
}) => {
  const [product] = await catalogue.products();
  expect(product).toBeDefined();

  await page.goto(`/product/${product.slug}`);

  await expect(jsonLdScript(page)).toHaveCount(1);
  expect(await readJsonLd(page)).toMatchObject({
    "@context": "https://schema.org",
    "@type": "Product",
    sku: product.slug,
    offers: { price: product.price, priceCurrency: "USD" },
  });
});

test("moving to a related product replaces the JSON-LD", async ({
  page,
  catalogue,
}) => {
  const [product] = await catalogue.products();
  expect(product).toBeDefined();

  await page.goto(`/product/${product.slug}`);
  await page.getByRole("button", { name: "See Product" }).first().click();

  await expect(page).not.toHaveURL(`/product/${product.slug}`);
  const relatedSlug = new URL(page.url()).pathname.split("/").pop();
  await expect.poll(async () => (await readJsonLd(page)).sku).toBe(relatedSlug);
  await expect(jsonLdScript(page)).toHaveCount(1);
});

test("the home page carries the schema.org Organization as JSON-LD", async ({
  page,
  baseURL,
}) => {
  await page.goto("/");

  await expect(jsonLdScript(page)).toHaveCount(1);
  expect(await readJsonLd(page)).toMatchObject({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Audiophile",
    url: `${baseURL}/`,
    logo: `${baseURL}/logo.svg`,
  });
});

test("the robots file names the sitemap", async ({ request }) => {
  const response = await request.get("/robots.txt");

  expect(response.ok()).toBe(true);
  expect(await response.text()).toContain(
    "Sitemap: https://audiophile.t-bendet.com/sitemap.xml",
  );
});

test("the sitemap lists product pages on the requesting origin", async ({
  request,
  baseURL,
  catalogue,
}) => {
  const [product] = await catalogue.products();
  expect(product).toBeDefined();

  const response = await request.get("/sitemap.xml");

  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toMatch(/^application\/xml/);
  expect(await response.text()).toContain(
    `<loc>${baseURL}/product/${product.slug}</loc>`,
  );
});
