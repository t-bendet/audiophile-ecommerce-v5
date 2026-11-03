// Screenshots for the #359 prototype. Run: node /tmp/proto359/shots.mjs [filter]
import pkg from "/Users/talbendet/Projects/Coding/monorepo/audiophile-ecommerce-v5/node_modules/.pnpm/@playwright+test@1.64.0/node_modules/@playwright/test/index.js";
import { mkdirSync } from "node:fs";
const { chromium } = pkg;

const BASE = "http://localhost:5173";
const OUT = "/tmp/proto359/out2";
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


const navCases = [
  { key: "home-to-category", signedIn: false, start: "/",
    go: (p) => p.locator("main").getByRole("link", { name: "shop" }).first().click() },
  { key: "category-to-product", signedIn: false, start: "/category/Headphones",
    go: (p) => p.getByRole("link", { name: "see product" }).first().click() },
  { key: "product-to-home", signedIn: false, start: "/category/Speakers",
    pre: (p) => p.getByRole("link", { name: "see product" }).first().click(),
    go: (p) => p.locator("nav a[href=\"/\"]").first().click() },
  { key: "signedin-home-to-orders", signedIn: true, start: "/", path: "/account/orders" },
  { key: "signedin-home-to-checkout", signedIn: true, start: "/", path: "/checkout" },
];
const clientNav = (path) => (p) => p.evaluate((to) => {
  window.history.pushState({}, "", to);
  window.dispatchEvent(new PopStateEvent("popstate"));
}, path);

const variant = process.argv[3] ?? "C";
const jobs = [];
for (const c of navCases) for (const [vpName, vp] of [["desktop", DESKTOP], ["phone", PHONE]]) {
  const name = `loading-${variant}-${c.key}-${vpName}`;
  if (!want(name)) continue;
  jobs.push((async () => {
    const page = await newPage(vp, { signedIn: c.signedIn });
    await page.goto(`${BASE}${c.start}?loading=${variant}&delay=0&dialog=A&cache=cold`);
    await page.waitForLoadState("networkidle");
    if (c.pre) { await c.pre(page); await page.waitForLoadState("networkidle"); await page.waitForTimeout(300); }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.getByRole("button", { name: "2000" }).click();
    await page.addStyleTag({ content: '[data-prototype-switcher],[class*=tsqd]{display:none!important}' });
    await (c.go ?? clientNav(c.path))(page);
    await page.waitForTimeout(700);
    await shot(page, name);
    await shot(page, `${name}-full`, { fullPage: true });
    await page.waitForTimeout(7000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await shot(page, `${name}-settled`);
    await shot(page, `${name}-settled-full`, { fullPage: true });
    await page.context().close();
  })());
}
await Promise.all(jobs);
await browser.close();
