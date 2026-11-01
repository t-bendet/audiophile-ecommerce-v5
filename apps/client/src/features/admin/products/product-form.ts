import type { ProductDTO } from "@repo/domain";
import { z } from "zod";

/**
 * What the edit form holds: every field an admin may change, as the inputs
 * carry it. Numbers travel as strings until submit, and the two list fields
 * (`fullLabel`, `featuresText`) are one textarea each, so the storefront's
 * headline lines and feature paragraphs are edited as lines and paragraphs.
 */
export type ProductFormValues = {
  name: string;
  price: string;
  categoryId: string;
  isNewProduct: boolean;
  description: string;
  featuresText: string;
  includedItems: { item: string; quantity: string }[];
  cartLabel: string;
  shortLabel: string;
  fullLabel: string;
};

/** The body `PATCH /products/:id` receives: the same fields in the catalogue's shape. */
export type ProductUpdateBody = Pick<
  ProductDTO,
  | "name"
  | "price"
  | "categoryId"
  | "isNewProduct"
  | "description"
  | "featuresText"
  | "includedItems"
  | "cartLabel"
  | "shortLabel"
  | "fullLabel"
>;

const WHOLE_DOLLARS = /^\d+$/;
const WHOLE_NUMBER = /^[1-9]\d*$/;

// The fields are validated as the inputs hold them, so a message lands on the
// field that needs the fix before anything is sent.
export const ProductFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  price: z
    .string()
    .trim()
    .regex(WHOLE_DOLLARS, "Enter the price in whole dollars"),
  categoryId: z.string().min(1, "Choose a category"),
  isNewProduct: z.boolean(),
  description: z.string().trim().min(1, "Description is required"),
  featuresText: z.string().trim().min(1, "Features are required"),
  includedItems: z
    .array(
      z.object({
        item: z.string().trim().min(1, "Item name is required"),
        quantity: z
          .string()
          .trim()
          .regex(WHOLE_NUMBER, "Quantity must be a whole number above zero"),
      }),
    )
    .min(1, "List at least one item in the box"),
  cartLabel: z.string().trim().min(1, "Cart label is required"),
  shortLabel: z.string().trim().min(1, "Short label is required"),
  fullLabel: z.string().trim().min(1, "Full label is required"),
}) satisfies z.ZodType<ProductFormValues>;

const lines = (text: string) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const paragraphs = (text: string) =>
  text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

/** The stored product as the inputs show it. */
export const toFormValues = (product: ProductDTO): ProductFormValues => ({
  name: product.name,
  price: String(product.price),
  categoryId: product.categoryId,
  isNewProduct: product.isNewProduct,
  description: product.description,
  featuresText: product.featuresText.join("\n\n"),
  includedItems: product.includedItems.map(({ item, quantity }) => ({
    item,
    quantity: String(quantity),
  })),
  cartLabel: product.cartLabel,
  shortLabel: product.shortLabel,
  fullLabel: product.fullLabel.join("\n"),
});

/**
 * The inputs as the catalogue stores them. The price is the whole-dollar
 * integer the storefront prints; the headline is one line per entry and the
 * features one paragraph per entry, as the storefront renders them.
 */
export const toUpdateBody = (values: ProductFormValues): ProductUpdateBody => ({
  name: values.name.trim(),
  price: Number(values.price.trim()),
  categoryId: values.categoryId,
  isNewProduct: values.isNewProduct,
  description: values.description.trim(),
  featuresText: paragraphs(values.featuresText),
  includedItems: values.includedItems.map(({ item, quantity }) => ({
    item: item.trim(),
    quantity: Number(quantity.trim()),
  })),
  cartLabel: values.cartLabel.trim(),
  shortLabel: values.shortLabel.trim(),
  fullLabel: lines(values.fullLabel),
});
