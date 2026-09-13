import { describe, expect, it } from "vitest";
import {
  ImageVariantSchema,
  SingleImageDTOSchema,
  SingleImageSchema,
  resolveImageUrl,
} from "../src/image.js";

const KEY = "categories/headphones/thumbnail.png";
const variant = { key: KEY, width: 438, height: 422 };

describe("ImageVariantSchema", () => {
  it("accepts a bucket key with both dimensions", () => {
    expect(ImageVariantSchema.parse(variant)).toEqual(variant);
  });

  it.for([
    ["a URL in place of a key", { ...variant, key: `https://cdn.test/${KEY}` }],
    ["a leading slash", { ...variant, key: `/${KEY}` }],
    ["an unlisted extension", { ...variant, key: "categories/a/b.gif" }],
    ["a missing width", { key: KEY, height: 422 }],
    ["a missing height", { key: KEY, width: 438 }],
    ["a fractional dimension", { ...variant, width: 438.5 }],
    ["a zero dimension", { ...variant, height: 0 }],
    ["an unknown field", { ...variant, src: "https://cdn.test/x.png" }],
  ] as const)("rejects %s", ([, input]) => {
    expect(ImageVariantSchema.safeParse(input).success).toBe(false);
  });
});

describe("SingleImageSchema", () => {
  it("accepts alt text and a variant", () => {
    const image = { altText: "Headphones", image: variant };
    expect(SingleImageSchema.parse(image)).toEqual(image);
  });

  it("rejects the resolved shape it is the counterpart of", () => {
    const resolved = {
      altText: "Headphones",
      src: `https://media.test/${KEY}`,
      width: 438,
      height: 422,
    };
    expect(SingleImageSchema.safeParse(resolved).success).toBe(false);
    expect(SingleImageDTOSchema.parse(resolved)).toEqual(resolved);
  });
});

describe("resolveImageUrl", () => {
  it("joins the host onto the key", () => {
    expect(resolveImageUrl("https://media.test", KEY)).toBe(
      `https://media.test/${KEY}`,
    );
  });
});
