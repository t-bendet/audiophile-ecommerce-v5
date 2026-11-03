// Screenshots for the #359 prototype. Run: node /tmp/proto359/shots.mjs [filter]
import pkg from "/Users/talbendet/Projects/Coding/monorepo/audiophile-ecommerce-v5/node_modules/.pnpm/@playwright+test@1.64.0/node_modules/@playwright/test/index.js";
import { mkdirSync } from "node:fs";
const { chromium } = pkg;

const BASE = "http://localhost:5173";
const OUT = "/tmp/proto359/out";
mkdirSync(OUT, { recursive: true });
const filter = process.argv[2] ?? "";

const PHONE = { width: 390, height: 844 };
const DESKTOP = { width: 1440, height: 900 };

const browser = await chromium.launch();

// Log in once; the login route allows ten attempts per fifteen minutes.
let session;
const signIn = async () => {
  if (session) return session;
  const ctx = await browser.newContext();
  const res = await ctx.request.post(`${BASE}/api/v1/auth/login`, {
    data: { email: "doe@example.com", password: "11111111" },
  });
  if (!res.ok()) throw new Error(`login ${res.status()}`);
  session = await ctx.storageState();
  await ctx.close();
  return session;
};

const newPage = async (viewport, { signedIn = false } = {}) => {
  const context = await browser.newContext({
    storageState: signedIn ? await signIn() : undefined,
    viewport,
    deviceScaleFactor: 1,
    isMobile: viewport === PHONE,
    hasTouch: viewport === PHONE,
  });
  const page = await context.newPage();
  return page;
};

const shot = async (page, name, opts = {}) => {
  await page.screenshot({ path: `${OUT}/${name}.png`, ...opts });
  console.log("wrote", name);
};

const want = (name) => name.includes(filter);

// ---- Loading: mid-navigation, 2s per request ----
const navCases = [
  {
    key: "home-to-category",
    signedIn: false,
    start: "/",
    go: (p) =>
      p.locator("main").getByRole("link", { name: "shop" }).first().click(),
  },
  {
    key: "category-to-product",
    signedIn: false,
    start: "/category/Headphones",
    go: (p) =>
      p.getByRole("link", { name: "see product" }).first().click(),
  },
  {
    key: "product-to-home",
    signedIn: false,
    start: "/category/Speakers",
    pre: (p) => p.getByRole("link", { name: "see product" }).first().click(),
    go: (p) => p.locator("nav a[href=\"/\"]").first().click(),
  },
  {
    key: "signedin-home-to-orders",
    signedIn: true,
    start: "/",
    go: (p) => p.evaluate(() => {
      // Client-side navigation as the account menu would do it.
      window.history.pushState({}, "", "/account/orders");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }),
  },
];

for (const variant of ["0", "A", "B", "C"]) {
  for (const c of navCases) {
    for (const [vpName, vp] of [
      ["desktop", DESKTOP],
      ["phone", PHONE],
    ]) {
      const name = `loading-${variant}-${c.key}-${vpName}`;
      if (!want(name)) continue;
      const page = await newPage(vp, { signedIn: c.signedIn });
      await page.goto(`${BASE}${c.start}?loading=${variant}&delay=0&dialog=A`);
      await page.waitForLoadState("networkidle");
      if (c.pre) {
        await c.pre(page);
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(300);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      // Slow every request from here on.
      await page.evaluate(() => {
        const s = JSON.parse(sessionStorage.getItem("PROTOTYPE-359") ?? "{}");
        sessionStorage.setItem(
          "PROTOTYPE-359",
          JSON.stringify({ ...s, delay: 2000 }),
        );
      });
      await page.getByRole("button", { name: "2000" }).click();
      await c.go(page);
      await page.waitForTimeout(900);
      await shot(page, name);
      await page.waitForTimeout(4500);
      await shot(page, `${name}-settled`);
      await page.context().close();
    }
  }
}

// ---- Home hero on a cold load, 2s per request ----
for (const variant of ["0", "A", "B", "C"]) {
  for (const [vpName, vp] of [
    ["desktop", DESKTOP],
    ["phone", PHONE],
  ]) {
    const name = `hero-${variant}-${vpName}`;
    if (!want(name)) continue;
    const page = await newPage(vp);
    // Land elsewhere first, so the home loader runs on a client navigation.
    await page.goto(`${BASE}/category/Speakers?loading=${variant}&delay=0`);
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "2000" }).click();
    await page.locator("nav a[href=\"/\"]").first().click();
    await page.waitForTimeout(900);
    await shot(page, `${name}-0900ms`);
    await page.waitForTimeout(1250);
    await shot(page, `${name}-2150ms`);
    await page.waitForTimeout(2350);
    await shot(page, `${name}-4500ms`);
    await page.context().close();
  }
}

// ---- Dialogs ----
const addToCart = async (page) => {
  await page.goto(`${BASE}/category/Headphones?delay=0`);
  await page.getByRole("link", { name: "see product" }).first().click();
  await page.getByRole("button", { name: "add to cart" }).click();
  await page.waitForTimeout(600);
};

for (const dialog of ["A", "B", "C"]) {
  for (const [vpName, vp] of [
    ["phone", PHONE],
    ["desktop", DESKTOP],
  ]) {
    if (vpName === "phone" && want(`dialog-${dialog}-menu-phone`)) {
      const page = await newPage(vp);
      await page.goto(`${BASE}/?dialog=${dialog}&delay=0&loading=A`);
      await page.waitForLoadState("networkidle");
      await page.getByRole("button", { name: "Open main menu" }).click();
      await page.waitForTimeout(600);
      await shot(page, `dialog-${dialog}-menu-phone`);
      await page.context().close();
    }
    if (want(`dialog-${dialog}-cart-${vpName}`)) {
      const page = await newPage(vp);
      await page.goto(`${BASE}/?dialog=${dialog}&delay=0&loading=A`);
      await addToCart(page);
      await page.getByRole("button", { name: "Open cart" }).click();
      await page.waitForTimeout(600);
      await shot(page, `dialog-${dialog}-cart-${vpName}`);
      await page.context().close();
    }
    if (want(`dialog-${dialog}-thankyou-${vpName}`)) {
      const page = await newPage(vp, { signedIn: true });
      await page.goto(`${BASE}/?dialog=${dialog}&delay=0&loading=A`);
      await addToCart(page);
      await page.goto(`${BASE}/checkout`);
      await page.waitForLoadState("networkidle");
      await page.getByRole("button", { name: "thank-you" }).click();
      await page.waitForTimeout(600);
      await shot(page, `dialog-${dialog}-thankyou-${vpName}`);
      await page.context().close();
    }
  }
}

// ---- Account menu fallback, held ----
for (const menu of ["A", "B", "C"]) {
  const name = `menu-${menu}`;
  if (!want(name)) continue;
  const page = await newPage(DESKTOP, { signedIn: true });
  await page.goto(`${BASE}/?menu=${menu}&delay=0`);
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "hold" }).click();
  await page.waitForTimeout(300);
  await shot(page, name, { clip: { x: 0, y: 0, width: 1440, height: 110 } });
  await page.context().close();
}

await browser.close();
