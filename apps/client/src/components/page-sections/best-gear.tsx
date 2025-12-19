import { ResponsivePicture } from "@/components/ui/responsivePicture";
import bestGearDesktopImg from "@/assets/desktop/image-best-gear.jpg";
import bestGearMobileImg from "@/assets/mobile/image-best-gear.jpg";
import bestGearTabletImg from "@/assets/tablet/image-best-gear.jpg";
import { Container } from "@/components/ui/container";

export const BestGearSection = () => {
  return (
    <Container classes="flex flex-col items-center justify-between gap-10 md:gap-16 lg:flex-row-reverse lg:gap-4">
      <ResponsivePicture
        mobileSrc={bestGearMobileImg}
        tabletSrc={bestGearTabletImg}
        desktopSrc={bestGearDesktopImg}
        ariaLabel="Best Gear"
        altText="Best Gear"
        classes="rounded-xl"
      />
      <div className="text-center text-neutral-900 md:max-w-xl lg:max-w-md lg:text-left">
        <h3 className="tracking-300 mb-8 text-2xl font-bold uppercase md:text-4xl">
          Bringing you the <span className="text-primary-500">best </span>
          audio gear
        </h3>
        <p className="opacity-50">
          Located at the heart of New York City, Audiophile is the premier store
          for high end headphones, earphones, speakers, and audio accessories.
          We have a large showroom and luxury demonstration rooms available for
          you to browse and experience a wide range of our products. Stop by our
          store to meet some of the fantastic people who make Audiophile the
          best place to buy your portable audio equipment.
        </p>
      </div>
    </Container>
  );
};
