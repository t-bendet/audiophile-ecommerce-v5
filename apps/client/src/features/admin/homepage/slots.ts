import type { ConfigDTO, ProductDTO } from "@repo/domain";

/** The four homepage slots, in the order the page renders them. */
export const HOMEPAGE_SLOTS = [
  {
    key: "featuredProductId",
    label: "Featured",
    image: "featuredImage",
    hint: "The hero at the top of the home page.",
  },
  {
    key: "showCaseCoverId",
    label: "Showcase cover",
    image: "showCaseImage",
    hint: "The large orange showcase card.",
  },
  {
    key: "showCaseWideId",
    label: "Showcase wide",
    image: "showCaseImage",
    hint: "The full-width showcase band.",
  },
  {
    key: "showCaseGridId",
    label: "Showcase grid",
    image: "showCaseImage",
    hint: "The half-width showcase card.",
  },
] as const;

export type HomepageSlot = (typeof HOMEPAGE_SLOTS)[number];
export type SlotKey = HomepageSlot["key"];

export type SlotIds = Pick<ConfigDTO, SlotKey>;

export const toSlotIds = (config: ConfigDTO): SlotIds => ({
  featuredProductId: config.featuredProductId,
  showCaseCoverId: config.showCaseCoverId,
  showCaseWideId: config.showCaseWideId,
  showCaseGridId: config.showCaseGridId,
});

export type SlotOption = {
  id: string;
  name: string;
  /** Chosen in another slot: shown, but not selectable here. */
  disabled: boolean;
};

/**
 * What a slot's select offers: only the products carrying the image the slot
 * renders, with a product already chosen in another slot disabled, so the
 * server never has to refuse a choice the page offered.
 */
export const slotOptions = (
  products: readonly ProductDTO[],
  slot: SlotKey,
  chosen: SlotIds,
): SlotOption[] => {
  const { image } = HOMEPAGE_SLOTS.find((entry) => entry.key === slot)!;
  const elsewhere = new Set(
    HOMEPAGE_SLOTS.filter((entry) => entry.key !== slot).map(
      (entry) => chosen[entry.key],
    ),
  );
  return products
    .filter((product) => product.images[image] !== null)
    .map((product) => ({
      id: product.id,
      name: product.name,
      disabled: elsewhere.has(product.id),
    }));
};

export const isSlotsChanged = (current: SlotIds, saved: SlotIds) =>
  HOMEPAGE_SLOTS.some(({ key }) => current[key] !== saved[key]);
