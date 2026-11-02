import { expect, freshShopper, test } from "../fixtures.js";

// The auth layout sends a signed-in shopper to the profile.
test.use({ storageState: { cookies: [], origins: [] } });

test("the login page shows the logo band and its Home link leads to the storefront", async ({
  page,
}) => {
  await page.goto("/auth/login");

  await expect(
    page.getByRole("heading", { name: "Welcome back", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "audiophile logo" }),
  ).toBeVisible();
  // The desktop pane's tagline and its "Back to Home" link give way to the band.
  await expect(page.getByText("Bringing you the")).toBeHidden();
  await expect(page.getByRole("link", { name: "Back to Home" })).toBeHidden();
  await expect(page.getByRole("button", { name: "Login" })).toBeVisible();

  await page.getByRole("link", { name: "Home", exact: true }).tap();

  await expect(page).toHaveURL("/");
  await expect(
    page.getByRole("button", { name: "Open main menu" }),
  ).toBeVisible();
});

test("the forgot-password page sends a link from the phone layout", async ({
  page,
}) => {
  const { email } = freshShopper();

  await page.goto("/auth/forgot-password");

  await expect(
    page.getByRole("heading", { name: "Forgot your password?", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Home", exact: true }),
  ).toBeVisible();

  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByRole("button", { name: "Send reset link" }).tap();

  await expect(
    page.getByRole("heading", { name: "Check your inbox", level: 1 }),
  ).toBeVisible();
});
