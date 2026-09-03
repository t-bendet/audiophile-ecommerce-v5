import { describe, expect, it } from "vitest";
import {
  buildMeta,
  parseOrderBy,
  parsePagination,
  parseSelect,
} from "../src/utils/query.js";

const ALLOWED = ["id", "name", "createdAt", "v", "thumbnail"] as const;

describe("parsePagination", () => {
  it("defaults to page 1 and limit 20", () => {
    expect(parsePagination()).toEqual({
      page: 1,
      limit: 20,
      skip: 0,
      take: 20,
    });
    expect(parsePagination({})).toEqual({
      page: 1,
      limit: 20,
      skip: 0,
      take: 20,
    });
  });

  it("derives skip from page and limit", () => {
    expect(parsePagination({ page: 3, limit: 10 })).toEqual({
      page: 3,
      limit: 10,
      skip: 20,
      take: 10,
    });
  });

  it("falls back to the defaults for values that are not positive numbers", () => {
    expect(parsePagination({ page: "abc", limit: "" })).toEqual({
      page: 1,
      limit: 20,
      skip: 0,
      take: 20,
    });
    expect(parsePagination({ page: 0, limit: 0 })).toEqual({
      page: 1,
      limit: 20,
      skip: 0,
      take: 20,
    });
  });

  it("coerces numeric strings", () => {
    expect(parsePagination({ page: "2", limit: "5" })).toEqual({
      page: 2,
      limit: 5,
      skip: 5,
      take: 5,
    });
  });
});

describe("buildMeta", () => {
  it("reports the page window over the total", () => {
    expect(buildMeta({ page: 2, limit: 10, total: 25 })).toEqual({
      page: 2,
      limit: 10,
      total: 25,
      totalPages: 3,
      hasNext: true,
      hasPrev: true,
    });
  });

  it("has no next or previous page on a single-page result", () => {
    expect(buildMeta({ page: 1, limit: 20, total: 3 })).toEqual({
      page: 1,
      limit: 20,
      total: 3,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    });
  });

  it("reports zero pages for an empty result", () => {
    expect(buildMeta({ page: 1, limit: 20, total: 0 })).toMatchObject({
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    });
  });
});

describe("parseSelect", () => {
  it("returns undefined when no fields are requested", () => {
    expect(parseSelect(undefined, ALLOWED)).toBeUndefined();
    expect(parseSelect("", ALLOWED)).toBeUndefined();
    expect(parseSelect(42, ALLOWED)).toBeUndefined();
  });

  it("keeps only allowed fields", () => {
    expect(parseSelect("id,name,secret", ALLOWED)).toEqual({
      id: true,
      name: true,
    });
  });

  it("returns undefined when nothing survives the whitelist", () => {
    expect(parseSelect("secret,password", ALLOWED)).toBeUndefined();
  });
});

describe("parseOrderBy", () => {
  it("defaults to descending id", () => {
    expect(parseOrderBy(undefined, ALLOWED)).toEqual([{ id: "desc" }]);
    expect(parseOrderBy("", ALLOWED)).toEqual([{ id: "desc" }]);
  });

  it("reads a leading minus as descending", () => {
    expect(parseOrderBy("-name", ALLOWED)).toEqual([{ name: "desc" }]);
  });

  it("keeps the order of a comma-separated list", () => {
    expect(parseOrderBy("name,-createdAt", ALLOWED)).toEqual([
      { name: "asc" },
      { createdAt: "desc" },
    ]);
  });

  it("drops fields outside the whitelist", () => {
    expect(parseOrderBy("name,hax", ALLOWED)).toEqual([{ name: "asc" }]);
    expect(parseOrderBy("-hax,createdAt", ALLOWED)).toEqual([
      { createdAt: "asc" },
    ]);
  });

  it("falls back to the default order when nothing survives", () => {
    expect(parseOrderBy("hax", ALLOWED)).toEqual([{ id: "desc" }]);
    expect(parseOrderBy("-hax,-alsoHax", ALLOWED)).toEqual([{ id: "desc" }]);
  });
});
