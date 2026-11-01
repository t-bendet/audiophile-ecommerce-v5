import type { ProductDTO } from "@repo/domain";
import { describe, expect, it } from "vitest";
import {
  ProductFormSchema,
  toFormValues,
  toUpdateBody,
} from "../src/features/admin/products/product-form";

const image = { altText: "a", src: "https://m/x.jpg", width: 1, height: 1 };
const responsive = {
  altText: "a",
  mobile: image,
  tablet: image,
  desktop: image,
};

const product: ProductDTO = {
  id: "0123456789abcdef01234567",
  categoryId: "0123456789abcdef01234568",
  name: "ZX9 Speaker",
  slug: "zx9-speaker",
  price: 4500,
  isNewProduct: true,
  description: "Big sound.",
  featuresText: ["First paragraph.", "Second paragraph."],
  includedItems: [
    { item: "Speaker unit", quantity: 2 },
    { item: "Cable", quantity: 1 },
  ],
  cartLabel: "ZX9",
  shortLabel: "ZX9 Speaker",
  fullLabel: ["ZX9", "Speaker"],
  featuredImageText: null,
  showCaseImageText: null,
  images: {
    featuredImage: null,
    showCaseImage: responsive,
    galleryImages: [],
    introImage: responsive,
    primaryImage: responsive,
    relatedProductImage: responsive,
    thumbnail: image,
  },
  v: 0,
  createdAt: new Date("2026-01-01"),
};

describe("the product edit form", () => {
  it("shows the stored product as the inputs hold it", () => {
    expect(toFormValues(product)).toEqual({
      name: "ZX9 Speaker",
      price: "4500",
      categoryId: product.categoryId,
      isNewProduct: true,
      description: "Big sound.",
      featuresText: "First paragraph.\n\nSecond paragraph.",
      includedItems: [
        { item: "Speaker unit", quantity: "2" },
        { item: "Cable", quantity: "1" },
      ],
      cartLabel: "ZX9",
      shortLabel: "ZX9 Speaker",
      fullLabel: "ZX9\nSpeaker",
    });
  });

  it("round-trips an unchanged product and sends neither slug nor images", () => {
    const body = toUpdateBody(toFormValues(product));

    expect(body).toEqual({
      name: product.name,
      price: 4500,
      categoryId: product.categoryId,
      isNewProduct: true,
      description: product.description,
      featuresText: product.featuresText,
      includedItems: product.includedItems,
      cartLabel: product.cartLabel,
      shortLabel: product.shortLabel,
      fullLabel: product.fullLabel,
    });
    expect(body).not.toHaveProperty("slug");
    expect(body).not.toHaveProperty("images");
  });

  it("turns the typed price and quantities into the catalogue's integers", () => {
    const values = toFormValues(product);
    const body = toUpdateBody({
      ...values,
      price: " 4600 ",
      featuresText: "One.\n\n\n  Two.  \n",
      fullLabel: " ZX9 \n\nSpeaker ",
      includedItems: [{ item: " Cable ", quantity: "3" }],
    });

    expect(body.price).toBe(4600);
    expect(body.featuresText).toEqual(["One.", "Two."]);
    expect(body.fullLabel).toEqual(["ZX9", "Speaker"]);
    expect(body.includedItems).toEqual([{ item: "Cable", quantity: 3 }]);
  });

  it("refuses a price or quantity that is not a whole number", () => {
    const values = toFormValues(product);

    const result = ProductFormSchema.safeParse({
      ...values,
      price: "45.50",
      includedItems: [{ item: "Cable", quantity: "0" }],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join("."))).toEqual([
      "price",
      "includedItems.0.quantity",
    ]);
    expect(ProductFormSchema.safeParse(values).success).toBe(true);
  });
});
