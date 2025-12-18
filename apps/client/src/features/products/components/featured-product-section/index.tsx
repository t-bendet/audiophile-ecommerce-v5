import { ResponsivePicture } from "@/components/ui/responsivePicture";
import { getFeaturedProductQueryOptions } from "@/features/products/api/get-product";
import ProductCard from "@/features/products/components/product-card";
import { useSuspenseQuery } from "@tanstack/react-query";

const FeaturedProductSection = () => {
  const { data: product } = useSuspenseQuery(getFeaturedProductQueryOptions());
  if (!product.data.images.featuredImage) {
    throw new Error("Featured product does not have a featured image.");
  }

  return (
    <>
      <ResponsivePicture
        mobileSrc={product.data.images.featuredImage.mobileSrc}
        tabletSrc={product.data.images.featuredImage.tabletSrc}
        desktopSrc={product.data.images.featuredImage.desktopSrc}
        altText={product.data.images.featuredImage.altText}
        ariaLabel={
          product.data.images.featuredImage.ariaLabel + "background image"
        }
        pictureClasses="col-span-full row-span-full"
        classes="h-full w-full object-cover object-bottom mix-blend-difference"
      />
      <section className="z-10 col-span-full row-span-full grid items-center justify-center lg:justify-start lg:pl-4">
        <ProductCard
          product={{
            id: product.data.id,
            title: product.data.fullLabel,
            isNewProduct: product.data.isNewProduct,
            slug: product.data.slug,
            description: product.data.featuredImageText || "",
          }}
        >
          <ProductCard.NewIndicator classes="text-neutral-50 opacity-50 lg:mb-6" />
          <ProductCard.Title classes="text-3xl lg:text-5xl" />
          <ProductCard.Description classes="mb-7 max-w-[30ch] md:max-w-[40ch] lg:mb-10" />
          <ProductCard.Actions hasNavigateAction />
        </ProductCard>
      </section>
    </>
  );
};

export default FeaturedProductSection;
