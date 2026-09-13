import type { ImageVariant, SingleImage } from "@repo/database";
import { z } from "zod";

/**
 * The two sides of the image boundary. Below it an image is a bucket key and
 * the file's pixel size; above it, an absolute URL and the same size. The host
 * is joined once, by the server, and never persisted.
 */

// * ===== Persisted Schemas (accepted on create and update) =====

export const IMAGE_KEY_PATTERN =
  /^(products|categories)\/[a-z0-9-]+\/[a-z0-9-]+\.(jpg|png|webp|avif)$/;

export const ImageKeySchema = z
  .string()
  .regex(
    IMAGE_KEY_PATTERN,
    "Image key must be a bucket path such as categories/headphones/thumbnail.png",
  );

export type ImageKey = z.infer<typeof ImageKeySchema>;

const PixelSchema = z.int().positive();

export const ImageVariantSchema = z
  .object({
    key: ImageKeySchema,
    width: PixelSchema,
    height: PixelSchema,
  })
  .strict() satisfies z.ZodType<ImageVariant>;

export const SingleImageSchema = z
  .object({
    altText: z.string().min(1, "Alt text is required"),
    image: ImageVariantSchema,
  })
  .strict() satisfies z.ZodType<SingleImage>;

// * ===== DTO Schemas (what the API returns) =====

export const ImageVariantDTOSchema = z
  .object({
    src: z.url("Src must be a valid URL"),
    width: PixelSchema,
    height: PixelSchema,
  })
  .strict();

// One image flattens into the field that holds it, so a thumbnail stays
// `thumbnail.src` for the client.
export const SingleImageDTOSchema = ImageVariantDTOSchema.extend({
  altText: z.string().min(1, "Alt text is required"),
}).strict();

export type ImageVariantDTO = z.infer<typeof ImageVariantDTOSchema>;
export type SingleImageDTO = z.infer<typeof SingleImageDTOSchema>;

// * ===== Resolution =====

/** Joins the media host onto a key. The only place the two ever meet. */
export const resolveImageUrl = (baseUrl: string, key: ImageKey) =>
  `${baseUrl}/${key}`;
