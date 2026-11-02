import type { Page } from "@playwright/test";
import { expect, freshShopper, test, type Shopper } from "./fixtures.js";

test.use({ storageState: { cookies: [], origins: [] } });

const signUpThroughForm = async (page: Page, shopper: Shopper) => {
  await page.goto("/auth/signup");
  await page.getByLabel("Full Name").fill(shopper.name);
  await page.getByLabel("Email").fill(shopper.email);
  await page.getByLabel("Password", { exact: true }).fill(shopper.password);
  await page.getByLabel("Confirm Password").fill(shopper.password);
  await page.getByRole("button", { name: "Create Account" }).click();
};

test("a fresh shopper signs up through the form and a second signup with that email is refused", async ({
  page,
  context,
}) => {
  const shopper = freshShopper();

  await signUpThroughForm(page, shopper);

  await expect(page).toHaveURL("/account/profile");
  await expect(
    page.getByRole("button", { name: "Open user menu" }),
  ).toContainText(shopper.name);

  await context.clearCookies();
  // `User.name` is unique as well, so only the email repeats.
  await signUpThroughForm(page, { ...freshShopper(), email: shopper.email });

  const emailField = page
    .getByRole("group")
    .filter({ has: page.getByRole("textbox", { name: "Email" }) });
  await expect(emailField.getByRole("alert")).toHaveText(
    "An account with this email already exists.",
  );
  await expect(page.getByRole("textbox", { name: "Email" })).toBeFocused();
  await expect(page).toHaveURL("/auth/signup");
});

test("a shopper who logs out from the account menu is a guest again", async ({
  page,
  signUpFreshShopper,
}) => {
  await signUpFreshShopper();

  await page.goto("/");
  await page.getByRole("button", { name: "Open user menu" }).click();
  await page.getByRole("menuitem", { name: "Log out" }).click();

  await page.getByRole("button", { name: "Open anonymous menu" }).click();
  await expect(page.getByRole("menuitem", { name: "Log in" })).toBeVisible();

  await page.goto("/checkout");
  await expect(page).toHaveURL("/auth/login?redirectTo=%2Fcheckout");
});
