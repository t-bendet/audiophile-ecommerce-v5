import { expect, test } from "./fixtures.js";

test.use({ storageState: { cookies: [], origins: [] } });

const categoryChunk = /\/assets\/category-[\w-]{8}\.js$/;
const contentLayoutChunk = /\/assets\/content-layout-[^/]+\.js$/;

test("a failed category chunk shows the route error and can be retried", async ({
  page,
}) => {
  await page.route(categoryChunk, (route) => route.abort());
  await page.goto("/");

  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Headphones", exact: true })
    .click();

  await expect(page).toHaveURL("/category/Headphones");
  await expect(
    page.getByRole("heading", { name: "Critical Application Error" }),
  ).toBeVisible();
  await expect(
    page.getByText("A critical error occurred. Please try again later."),
  ).toBeVisible();
  await expect(page.getByRole("navigation")).toBeVisible();

  await page.unroute(categoryChunk);
  await page.getByRole("button", { name: "Go Back" }).click();
  await expect(page).toHaveURL("/");
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Headphones", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Headphones", level: 1 }),
  ).toBeVisible();
});

test("a failed content layout chunk shows the main fallback", async ({
  page,
}) => {
  await page.route(contentLayoutChunk, (route) => route.abort());
  await page.goto("/auth/login");
  await page.getByRole("link", { name: "Back to Home" }).click();

  await expect(page.getByRole("alert")).toContainText(
    "Ooops, something went wrong",
  );
  await expect(page.getByRole("button", { name: "Refresh" })).toBeVisible();
});
