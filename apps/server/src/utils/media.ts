import {
  resolveImageUrl,
  type ImageVariantDTO,
  type ResponsiveImageDTO,
  type SingleImageDTO,
} from "@repo/domain";
import type {
  ImageVariant,
  ResponsiveImage,
  SingleImage,
} from "@repo/database";
import { env } from "./env.js";

// The one place a persisted key meets the media host; nothing below the API
// boundary sees a URL.
export const toImageVariantDTO = ({
  key,
  width,
  height,
}: ImageVariant): ImageVariantDTO => ({
  src: resolveImageUrl(env.MEDIA_BASE_URL, key),
  width,
  height,
});

export const toSingleImageDTO = ({
  altText,
  image,
}: SingleImage): SingleImageDTO => ({
  altText,
  ...toImageVariantDTO(image),
});

export const toResponsiveImageDTO = ({
  altText,
  mobile,
  tablet,
  desktop,
}: ResponsiveImage): ResponsiveImageDTO => ({
  altText,
  mobile: toImageVariantDTO(mobile),
  tablet: toImageVariantDTO(tablet),
  desktop: toImageVariantDTO(desktop),
});
