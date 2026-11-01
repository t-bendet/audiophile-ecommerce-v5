import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../src/app.js";
import {
  createCategory,
  createProduct,
  resetDatabase,
} from "./helpers/database.js";

const locations = (xml: string) =>
  [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map(([, loc]) => loc);

beforeEach(resetDatabase);

describe("GET /sitemap.xml", () => {
  it("lists the home, category and product pages on the requesting origin", async () => {
    const category = await createCategory("Speakers");
    const product = await createProduct({ categoryId: category.id });

    const res = await request(app)
      .get("/sitemap.xml")
      .set("Host", "audiophile.t-bendet.com")
      .set("X-Forwarded-Proto", "https");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/^application\/xml/);
    expect(res.text).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>\n/);
    expect(res.text).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    );
    expect(locations(res.text)).toEqual([
      "https://audiophile.t-bendet.com/",
      "https://audiophile.t-bendet.com/category/Speakers",
      `https://audiophile.t-bendet.com/product/${product.slug}`,
    ]);
  });

  it("falls back to the connection's protocol and host", async () => {
    const res = await request(app).get("/sitemap.xml");

    expect(res.status).toBe(200);
    expect(locations(res.text)).toEqual([
      expect.stringMatching(/^http:\/\/127\.0\.0\.1:\d+\/$/),
    ]);
  });
});
