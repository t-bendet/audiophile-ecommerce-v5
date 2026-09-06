import { describe, expect, it } from "vitest";
import { SlugValidator, slugify } from "../src/index.js";

describe("slugify", () => {
  it("lowercases and hyphenates a product name", () => {
    expect(slugify("XX99 Mark II Headphones")).toBe("xx99-mark-ii-headphones");
  });

  it("strips diacritics", () => {
    expect(slugify("Écouteurs Spëaker")).toBe("ecouteurs-speaker");
  });

  it("collapses leading, trailing and repeated separators", () => {
    expect(slugify("  --ZX9 -- Speaker!!  ")).toBe("zx9-speaker");
  });

  it("cuts to 80 characters and leaves no trailing hyphen", () => {
    const slug = slugify(`${"a".repeat(79)} b`);

    expect(slug).toBe("a".repeat(79));
  });
});

describe("SlugValidator", () => {
  const validator = SlugValidator("Product");

  it("accepts a well-formed slug", () => {
    expect(validator.safeParse("xx59-headphones").success).toBe(true);
  });

  it.each(["Foo", "-foo", "foo-", "foo--bar", "fo", "a".repeat(81)])(
    "rejects %s",
    (slug) => {
      expect(validator.safeParse(slug).success).toBe(false);
    },
  );
});
