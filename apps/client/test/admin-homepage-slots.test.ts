import type { ProductDTO } from "@repo/domain";
import { describe, expect, it } from "vitest";
import {
  HOMEPAGE_SLOTS,
  isSlotsChanged,
  slotOptions,
} from "../src/features/admin/homepage/slots";

const image = { altText: "a", src: "https://m/x.jpg", width: 1, height: 1 };
const responsive = {
  altText: "a",
  mobile: image,
  tablet: image,
  desktop: image,
};

const product = (
  id: string,
  images: { featuredImage: boolean; showCaseImage: boolean },
): ProductDTO =>
  ({
    id,
    name: id,
    images: {
      featuredImage: images.featuredImage ? responsive : null,
      showCaseImage: images.showCaseImage ? responsive : null,
      galleryImages: [],
      introImage: responsive,
      primaryImage: responsive,
      relatedProductImage: responsive,
      thumbnail: image,
    },
  }) as unknown as ProductDTO;

const catalogue = [
  product("hero", { featuredImage: true, showCaseImage: false }),
  product("both", { featuredImage: true, showCaseImage: true }),
  product("cover", { featuredImage: false, showCaseImage: true }),
  product("plain", { featuredImage: false, showCaseImage: false }),
];

const chosen = {
  featuredProductId: "hero",
  showCaseCoverId: "cover",
  showCaseWideId: "both",
  showCaseGridId: "plain",
};

describe("the homepage slot picker", () => {
  it("offers a slot only the products carrying its image", () => {
    expect(
      slotOptions(catalogue, "featuredProductId", chosen).map((o) => o.id),
    ).toEqual(["hero", "both"]);
    expect(
      slotOptions(catalogue, "showCaseGridId", chosen).map((o) => o.id),
    ).toEqual(["both", "cover"]);
  });

  it("disables a product chosen in another slot but not in this one", () => {
    const options = slotOptions(catalogue, "showCaseCoverId", chosen);

    expect(options).toEqual([
      { id: "both", name: "both", disabled: true },
      { id: "cover", name: "cover", disabled: false },
    ]);
  });

  it("knows when a slot moved", () => {
    expect(isSlotsChanged(chosen, chosen)).toBe(false);
    expect(isSlotsChanged({ ...chosen, showCaseGridId: "cover" }, chosen)).toBe(
      true,
    );
    expect(HOMEPAGE_SLOTS.map((slot) => slot.key)).toEqual([
      "featuredProductId",
      "showCaseCoverId",
      "showCaseWideId",
      "showCaseGridId",
    ]);
  });
});
