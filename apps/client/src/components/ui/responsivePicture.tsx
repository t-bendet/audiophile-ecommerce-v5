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
};

export const ResponsivePicture = (props: TResponsivePicture) => {
  return (
    <picture className={cn("overflow-hidden", props.pictureClasses)}>
      <source
        media={props.mobileCustomMediaQuery || "(max-width: 767px)"}
        srcSet={props.mobileSrc}
        aria-label={props.ariaLabel}
      />
      <source
        media={props.tabletCustomMediaQuery || "(max-width: 1023px)"}
        srcSet={props.tabletSrc}
        aria-label={props.ariaLabel}
      />
      <source srcSet={props.desktopSrc} aria-label={props.ariaLabel} />
      <img
        src={props.mobileSrc}
        aria-label={props.ariaLabel}
        alt={props.altText}
        className={cn("overflow-hidden", props.classes)}
      />
    </picture>
  );
};
