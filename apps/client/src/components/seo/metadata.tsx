import { useLocation } from "react-router";

type MetadataProps = {
  title?: string;
  description?: string;
  image?: string;
  type?: "website" | "article" | "product";
  noIndex?: boolean;
};

const SITE_NAME = "Audiophile";
const DEFAULT_DESCRIPTION =
  "Discover premium headphones, earphones, and speakers from Audiophile.";

const getAbsoluteUrl = (pathOrUrl: string, origin: string) => {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  if (!pathOrUrl.startsWith("/")) {
    return `${origin}/${pathOrUrl}`;
  }
  return `${origin}${pathOrUrl}`;
};

export const Metadata = ({
  title,
  description,
  image,
  type = "website",
  noIndex = false,
}: MetadataProps) => {
  const location = useLocation();
  const resolvedTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const resolvedDescription = description ?? DEFAULT_DESCRIPTION;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = origin ? `${origin}${location.pathname}` : location.pathname;
  const resolvedImage = image && origin ? getAbsoluteUrl(image, origin) : image;

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
      {resolvedImage && (
        <meta name="twitter:image" content={resolvedImage} />
      )}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
    </>
  );
};
