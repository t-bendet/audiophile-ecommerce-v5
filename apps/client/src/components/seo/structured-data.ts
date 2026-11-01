import { paths } from "@/config/paths";

export const SITE_NAME = "Audiophile";

// A static copy of the nav-bar logo, so the URL crawlers store never changes.
const LOGO_PATH = "/logo.svg";

/** A schema.org thing, serialized as JSON-LD by the `Metadata` component. */
export type StructuredData = { "@type": string } & Record<string, unknown>;

const siteOrigin = () =>
  typeof window !== "undefined" ? window.location.origin : "";

export const toAbsoluteUrl = (pathOrUrl: string) => {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  return `${siteOrigin()}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
};

type ProductStructuredDataInput = {
  name: string;
  description: string;
  image: string;
  slug: string;
  /** Whole US dollars, as the catalogue stores it. */
  price: number;
};

export const productStructuredData = ({
  name,
  description,
  image,
  slug,
  price,
}: ProductStructuredDataInput): StructuredData => {
  const url = toAbsoluteUrl(paths.product.getHref(slug));
  return {
    "@type": "Product",
    name,
    description,
    image: toAbsoluteUrl(image),
    sku: slug,
    brand: { "@type": "Brand", name: SITE_NAME },
    url,
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url,
    },
  };
};

export const organizationStructuredData = (): StructuredData => ({
  "@type": "Organization",
  name: SITE_NAME,
  url: toAbsoluteUrl(paths.home.getHref()),
  logo: toAbsoluteUrl(LOGO_PATH),
});

// `<` is escaped so a description can never close the script element early.
export const serializeStructuredData = (data: StructuredData) =>
  JSON.stringify({ "@context": "https://schema.org", ...data }).replace(
    /</g,
    "\\u003c",
  );
