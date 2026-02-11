import { cn } from "@/lib/cn";

type TResponsivePicture = {
  mobileSrc: string;
  tabletSrc: string;
  desktopSrc: string;
  ariaLabel: string;
  altText: string;
  classes?: string;
  pictureClasses?: string;
  mobileCustomMediaQuery?: string;
  tabletCustomMediaQuery?: string;
  width?: number;
  height?: number;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
};

export const ResponsivePicture = (props: TResponsivePicture) => {
  return (
    <picture className={cn("overflow-hidden", props.pictureClasses)}>
      <source
        media={props.mobileCustomMediaQuery || "(max-width: 767px)"}
        srcSet={props.mobileSrc}
      />
      <source
        media={props.tabletCustomMediaQuery || "(max-width: 1023px)"}
        srcSet={props.tabletSrc}
      />
      <source srcSet={props.desktopSrc} />
      <img
        src={props.mobileSrc}
        aria-label={props.ariaLabel}
        alt={props.altText}
        className={cn("overflow-hidden", props.classes)}
        width={props.width}
        height={props.height}
        loading={props.loading}
        fetchPriority={props.fetchPriority}
      />
    </picture>
  );
};
