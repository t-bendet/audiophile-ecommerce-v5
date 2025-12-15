import { Container } from "@/components/ui/container";
import { ResponsivePicture } from "@/components/ui/responsivePicture";
import { Section } from "@/components/ui/section";
import { useSuspenseQuery } from "@tanstack/react-query";
import { $Enums } from "@repo/database";
import { getProductsByCategoryQueryOptions } from "../api/get-products";
import ProductCard from "./product-card";

export default function ProductsList({
  categoryName,
}: {
  categoryName: $Enums.NAME;
}) {
  const { data: ProductsResponse } = useSuspenseQuery(
    getProductsByCategoryQueryOptions(categoryName),
  );
  return (
    <>
      {ProductsResponse.data.map((product, i) => (
        <Section key={product.id}>
          <Container
            classes={`flex flex-col gap-8 md:gap-14 lg:flex-row lg:gap-31 ${i % 2 === 1 ? "lg:flex-row-reverse" : ""}`}
          >
            <ResponsivePicture
              mobileSrc={product.images.introImage.mobileSrc}
              tabletSrc={product.images.introImage.tabletSrc}
              desktopSrc={product.images.introImage.desktopSrc}
              altText={product.images.introImage.altText}
              ariaLabel={product.images.introImage.ariaLabel}
              pictureClasses="rounded-sm"
            />
            <ProductCard
              product={{
                id: product.id,
                title: product.fullLabel,
                isNewProduct: product.isNewProduct,
                slug: product.slug,
                description: product.description,
              }}
              classes="w-full text-neutral-900"
            >
              <ProductCard.NewIndicator />
              <ProductCard.Title classes="lg:mb-8" />
              <ProductCard.Description classes="max-w-[60ch] opacity-50 lg:mb-10 lg:max-w-[46ch]" />
              <ProductCard.Actions hasNavigateAction />
            </ProductCard>
          </Container>
        </Section>
      ))}
    </>
  );
}
