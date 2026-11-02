import type { Page } from "@playwright/test";
import {
  expect,
  freshShopper,
  SEEDED_SHOPPER,
  test,
  type Shopper,
} from "./fixtures.js";

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

const requestResetLink = async (page: Page, email: string) => {
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByRole("button", { name: "Send reset link" }).click();
};

const RESET_LINK = /\/auth\/reset-password\?token=[a-f0-9]{64}/;

test("a seeded shopper requests a reset link from the login page and is emailed one", async ({
  page,
  outbox,
}) => {
  await page.goto("/auth/login");
  await page.getByRole("link", { name: "Forgot your password?" }).click();
  await expect(page).toHaveURL("/auth/forgot-password");
  await expect(
    page.getByRole("heading", { name: "Forgot your password?" }),
  ).toBeVisible();

  await requestResetLink(page, SEEDED_SHOPPER.email);

  await expect(
    page.getByRole("heading", { name: "Check your inbox" }),
  ).toBeVisible();
  await expect(
    page.getByText(SEEDED_SHOPPER.email, { exact: true }),
  ).toBeVisible();
  // The email is sent before the route answers, so it is already in the outbox.
  // The seeded shopper is shared, so a retry may have left an earlier one too.
  const emails = await outbox(SEEDED_SHOPPER.email);
  expect(
    emails.some(
      (email) =>
        email.subject === "Reset your Audiophile password" &&
        RESET_LINK.test(email.text),
    ),
  ).toBe(true);
});

test("an unknown email sees the same sent state, is sent nothing, and can try another email", async ({
  page,
  outbox,
}) => {
  const { email } = freshShopper();

  await page.goto("/auth/forgot-password");
  await requestResetLink(page, email);

  await expect(
    page.getByRole("heading", { name: "Check your inbox" }),
  ).toBeVisible();
  await expect(page.getByText(email, { exact: true })).toBeVisible();
  expect(await outbox(email)).toEqual([]);

  await page.getByRole("button", { name: "try another email" }).click();
  await expect(
    page.getByRole("heading", { name: "Forgot your password?" }),
  ).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Email" })).toHaveValue(email);
});
