import { cn } from "@/lib/cn";
import type { ResponsiveImageDTO } from "@repo/domain";

type TResponsivePicture = ResponsiveImageDTO & {
  classes?: string;
  pictureClasses?: string;
  mobileCustomMediaQuery?: string;
  tabletCustomMediaQuery?: string;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
};

export const ResponsivePicture = ({
  altText,
  mobile,
  tablet,
  desktop,
  classes,
  pictureClasses,
  mobileCustomMediaQuery,
  tabletCustomMediaQuery,
  loading,
  fetchPriority,
}: TResponsivePicture) => {
  return (
    <picture className={cn("overflow-hidden", pictureClasses)}>
      {/* Each source states its own size, so the box is reserved per breakpoint. */}
      <source
        media={mobileCustomMediaQuery || "(max-width: 767px)"}
        srcSet={mobile.src}
        width={mobile.width}
        height={mobile.height}
      />
      <source
        media={tabletCustomMediaQuery || "(max-width: 1023px)"}
        srcSet={tablet.src}
        width={tablet.width}
        height={tablet.height}
      />
      <source
        srcSet={desktop.src}
        width={desktop.width}
        height={desktop.height}
      />
      <img
        src={mobile.src}
        alt={altText}
        className={cn("overflow-hidden", classes)}
        width={mobile.width}
        height={mobile.height}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
      />
    </picture>
  );
};
