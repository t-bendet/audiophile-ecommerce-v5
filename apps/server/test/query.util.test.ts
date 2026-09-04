import { AppError, ErrorCode } from "@repo/domain";
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

const detailsOf = (run: () => unknown) => {
  try {
    run();
  } catch (err) {
    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).code).toBe(ErrorCode.VALIDATION_ERROR);
    return (err as AppError).details ?? [];
  }

  throw new Error("expected the call to throw");
};

describe("parseSelect", () => {
  it("returns undefined when no fields are requested", () => {
    expect(parseSelect(undefined, ALLOWED)).toBeUndefined();
    expect(parseSelect(42, ALLOWED)).toBeUndefined();
  });

  it("rejects an empty value, as the request schema does", () => {
    expect(() => parseSelect("", ALLOWED)).toThrow(AppError);
  });

  it("keeps every requested field when all are allowed", () => {
    expect(parseSelect("id,name", ALLOWED)).toEqual({
      id: true,
      name: true,
    });
  });

  it("rejects the whole list when one field is outside the whitelist", () => {
    const details = detailsOf(() => parseSelect("id,name,secret", ALLOWED));

    expect(details).toEqual([
      {
        code: "unknown_value",
        message: expect.stringContaining('Unknown fields value "secret"'),
        path: ["query", "fields"],
      },
    ]);
  });

  it("names every field outside the whitelist", () => {
    const details = detailsOf(() => parseSelect("secret,password", ALLOWED));

    expect(details.map((detail) => detail.message)).toEqual([
      expect.stringContaining('"secret"'),
      expect.stringContaining('"password"'),
    ]);
  });
});

describe("parseOrderBy", () => {
  it("defaults to descending id", () => {
    expect(parseOrderBy(undefined, ALLOWED)).toEqual([{ id: "desc" }]);
  });

  it("rejects an empty value, as the request schema does", () => {
    expect(() => parseOrderBy("", ALLOWED)).toThrow(AppError);
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

  it("rejects the whole list when one field is outside the whitelist", () => {
    const details = detailsOf(() => parseOrderBy("name,hax", ALLOWED));

    expect(details).toEqual([
      {
        code: "unknown_value",
        message: expect.stringContaining('Unknown sort value "hax"'),
        path: ["query", "sort"],
      },
    ]);
  });

  it("names the offending member with its direction prefix intact", () => {
    const details = detailsOf(() => parseOrderBy("-hax,createdAt", ALLOWED));

    expect(details.map((detail) => detail.message)).toEqual([
      expect.stringContaining('"-hax"'),
    ]);
  });

  it("names every member outside the whitelist", () => {
    const details = detailsOf(() => parseOrderBy("-hax,-alsoHax", ALLOWED));

    expect(details.map((detail) => detail.message)).toEqual([
      expect.stringContaining('"-hax"'),
      expect.stringContaining('"-alsoHax"'),
    ]);
  });
});
