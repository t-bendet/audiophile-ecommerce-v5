import type { Page } from "@playwright/test";
import {
  expect,
  freshShopper,
  SEEDED_SHOPPER,
  SEEDED_ADMIN,
  test,
  type Shopper,
} from "./fixtures.js";

test.use({ storageState: { cookies: [], origins: [] } });

const signUpThroughForm = async (page: Page, shopper: Shopper) => {
  await page.goto("/auth/signup");
  await page.getByLabel("Full name").fill(shopper.name);
  await page.getByLabel("Email").fill(shopper.email);
  await page.getByLabel("Password", { exact: true }).fill(shopper.password);
  await page.getByLabel("Confirm password").fill(shopper.password);
  await page.getByRole("button", { name: "Create account" }).click();
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

test("a shopper who logs out from the account menu lands on the home page as a guest", async ({
  page,
  signUpFreshShopper,
}) => {
  await signUpFreshShopper();

  await page.goto("/");
  await page.getByRole("button", { name: "Open user menu" }).click();
  await page.getByRole("menuitem", { name: "Log out" }).click();

  const anonymousMenu = page.getByRole("button", {
    name: "Open anonymous menu",
  });
  await expect(anonymousMenu).toBeVisible();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("button", { name: "Open cart" })).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /something went wrong|Critical Application Error|Request Failed/,
    }),
  ).toHaveCount(0);

  await anonymousMenu.click();
  await expect(page.getByRole("menuitem", { name: "Log in" })).toBeVisible();

  await page.goto("/checkout");
  await expect(page).toHaveURL("/auth/login?redirectTo=%2Fcheckout");
});

test("the anonymous menu login row works by pointer and keyboard", async ({
  page,
}) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Open anonymous menu" });
  await trigger.click();
  const login = page.getByRole("menuitem", { name: "Log in" });
  await expect(login).toHaveAttribute("href", "/auth/login");
  const box = await login.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await expect(page).toHaveURL("/auth/login");

  await page.goto("/");
  await trigger.focus();
  await page.keyboard.press("ArrowDown");
  await expect(login).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/auth/login");
});

test("account menu rows work by pointer and keyboard", async ({
  page,
  signUpFreshShopper,
}) => {
  await signUpFreshShopper();
  const links = [
    {
      name: "Profile",
      path: "/account/profile",
      readyText: "Member since",
    },
    {
      name: "Security",
      path: "/account/security",
      readyText: "Change password",
    },
    {
      name: "Orders",
      path: "/account/orders",
      readyText: "You have no orders yet.",
    },
  ];

  for (const [index, link] of links.entries()) {
    await page.goto("/");
    const trigger = page.getByRole("button", { name: "Open user menu" });
    await trigger.click();
    const item = page.getByRole("menuitem", { name: link.name });
    await expect(item).toHaveAttribute("href", link.path);
    const box = await item.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await expect(page).toHaveURL(link.path);
    await expect(
      page
        .getByText(link.readyText, { exact: link.name !== "Profile" })
        .first(),
    ).toBeVisible();
    await expect(item).toBeHidden();
    await trigger.click();
    await expect(
      page.getByRole("menuitem", { name: link.name }),
    ).toHaveAttribute("aria-current", "page");

    await page.goto("/");
    await trigger.focus();
    await page.keyboard.press("ArrowDown");
    await expect(
      page.getByRole("menuitem", { name: links[0]!.name }),
    ).toBeFocused();
    for (let i = 0; i < index; i++) {
      await page.keyboard.press("ArrowDown");
      await expect(
        page.getByRole("menuitem", { name: links[i + 1]!.name }),
      ).toBeFocused();
    }
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(link.path);
  }
});

test("a shopper edits their profile and sees a taken email error", async ({
  page,
  signUpFreshShopper,
}) => {
  const shopper = await signUpFreshShopper();
  await page.goto("/account/profile");
  const newName = `${shopper.name} Updated`;
  await page.getByLabel("Name", { exact: true }).fill(newName);
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Profile updated")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open user menu" }),
  ).toContainText(newName);
  await page.getByLabel("Email").fill(SEEDED_ADMIN.email);
  await page.getByRole("button", { name: "Save changes" }).click();
  const email = page
    .getByRole("group")
    .filter({ has: page.getByRole("textbox", { name: "Email" }) });
  await expect(email.getByRole("alert")).toHaveText(
    "An account with this email already exists.",
  );
  await expect(page.getByLabel("Email")).toBeFocused();
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

const signInThroughForm = async (
  page: Page,
  { email, password }: { email: string; password: string },
) => {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Login" }).click();
};

const setNewPassword = async (page: Page, password: string) => {
  await page.getByLabel("New password", { exact: true }).fill(password);
  await page.getByLabel("Confirm new password").fill(password);
  await page.getByRole("button", { name: "Save new password" }).click();
};

test("a shopper resets the password from the emailed link, the link works once, and only the new password signs in", async ({
  page,
  context,
  outbox,
  signUpFreshShopper,
}) => {
  const shopper = await signUpFreshShopper();
  const newPassword = "new-pass-2222";
  await context.clearCookies();

  await page.goto("/auth/forgot-password");
  await requestResetLink(page, shopper.email);
  await expect(
    page.getByRole("heading", { name: "Check your inbox" }),
  ).toBeVisible();
  const [email] = await outbox(shopper.email);
  const resetLink = RESET_LINK.exec(email!.text)![0];

  await page.goto(resetLink);
  await expect(
    page.getByRole("heading", { name: "Set a new password" }),
  ).toBeVisible();
  await setNewPassword(page, newPassword);

  await expect(page).toHaveURL("/account/profile");
  await expect(page.getByText("Password updated")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open user menu" }),
  ).toContainText(shopper.name);

  await context.clearCookies();
  await page.goto(resetLink);
  await setNewPassword(page, "another-pass-3333");
  await expect(
    page.getByRole("heading", { name: "This link has expired" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Request a new link" }).click();
  await expect(page).toHaveURL("/auth/forgot-password");

  await page.goto("/auth/login");
  await signInThroughForm(page, shopper);
  await expect(page.getByText("Incorrect email or password")).toBeVisible();
  await expect(page).toHaveURL("/auth/login");

  await signInThroughForm(page, {
    email: shopper.email,
    password: newPassword,
  });
  await expect(page).toHaveURL("/account/profile");
});

test("changing a password keeps this device signed in and signs out another", async ({
  page,
  browser,
  signUpFreshShopper,
}) => {
  const shopper = await signUpFreshShopper();
  const otherContext = await browser.newContext();
  try {
    const other = await otherContext.newPage();
    await other.goto("/auth/login");
    await signInThroughForm(other, shopper);
    await expect(other).toHaveURL("/account/profile");

    await page.goto("/account/security");
    await page.getByLabel("Current password").fill("wrong-password");
    await page
      .getByLabel("New password", { exact: true })
      .fill("new-pass-2222");
    await page.getByLabel("Confirm new password").fill("different-password");
    await page.getByRole("button", { name: "Update password" }).click();
    const confirm = page
      .getByRole("group")
      .filter({ has: page.getByLabel("Confirm new password") });
    await expect(confirm.getByRole("alert")).toHaveText(
      "Password and PasswordConfirm must match!",
    );
    await page.getByLabel("Confirm new password").fill("new-pass-2222");
    await page.getByRole("button", { name: "Update password" }).click();
    const current = page
      .getByRole("group")
      .filter({ has: page.getByLabel("Current password") });
    await expect(current.getByRole("alert")).toHaveText(
      "Your current password is wrong.",
    );
    await expect(page.getByLabel("Current password")).toBeFocused();
    await page.getByLabel("Current password").fill(shopper.password);
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(page.getByText("Password updated")).toBeVisible();
    await expect(
      page.getByText("Every other device has been signed out."),
    ).toBeVisible();
    await expect(page.getByLabel("Current password")).toHaveValue("");
    await page.goto("/account/profile");
    await expect(page).toHaveURL("/account/profile");
    await other.goto("/account/profile");
    await expect(other).toHaveURL(/\/auth\/login/);
  } finally {
    await otherContext.close();
  }
});
