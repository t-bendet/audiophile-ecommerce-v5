import { useLocation } from "react-router";
import {
  SITE_NAME,
  serializeStructuredData,
  toAbsoluteUrl,
  type StructuredData,
} from "./structured-data";

type MetadataProps = {
  title?: string;
  description?: string;
  image?: string;
  type?: "website" | "article" | "product";
  noIndex?: boolean;
  structuredData?: StructuredData;
};

const DEFAULT_DESCRIPTION =
  "Discover premium headphones, earphones, and speakers from Audiophile.";

export const Metadata = ({
  title,
  description,
  image,
  type = "website",
  noIndex = false,
  structuredData,
}: MetadataProps) => {
  const location = useLocation();
  const resolvedTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const resolvedDescription = description ?? DEFAULT_DESCRIPTION;
  const url = toAbsoluteUrl(location.pathname);
  const resolvedImage = image && toAbsoluteUrl(image);

  return (
    <>
      <title>{resolvedTitle}</title>
      <meta name="description" content={resolvedDescription} />
      <meta property="og:title" content={resolvedTitle} />
      <meta property="og:description" content={resolvedDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      {resolvedImage && <meta property="og:image" content={resolvedImage} />}
      <meta
        name="twitter:card"
        content={resolvedImage ? "summary_large_image" : "summary"}
      />
      <meta name="twitter:title" content={resolvedTitle} />
      <meta name="twitter:description" content={resolvedDescription} />
      {resolvedImage && <meta name="twitter:image" content={resolvedImage} />}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeStructuredData(structuredData),
          }}
        />
      )}
    </>
  );
};
