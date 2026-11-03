import { SafeRenderWithErrorBlock } from "@/components/errors/safe-render-with-error-block";
import { BestGearSection } from "@/components/page-sections";
import { Metadata } from "@/components/seo/metadata";
import { organizationStructuredData } from "@/components/seo/structured-data";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import CategoryNavList from "@/features/categories/components/category-nav-list";
import { getFeaturedProductQueryOptions } from "@/features/products/api/get-product";
import { getShowCaseProductsQueryOptions } from "@/features/products/api/get-products";
import FeaturedProductSection from "@/features/products/components/featured-product-section";
import ShowCaseProductsSection from "@/features/products/components/showcase-section";
import { normalizeError } from "@/lib/errors/errors";
import type { ResponsiveImageDTO } from "@repo/domain";
import { QueryClient } from "@tanstack/react-query";
import { preload } from "react-dom";
import { LoaderFunctionArgs } from "react-router";

const Home = () => {
  return (
    <>
      <Metadata
        title="Home"
        description="Explore premium headphones, earphones, and speakers from Audiophile."
        structuredData={organizationStructuredData()}
      />
      <main>
        <Section classes="mb-10 h-[calc(100vh-(var(--nav-bar-height)))] w-full bg-neutral-900 md:mb-24 lg:mb-30">
          <Container classes="grid h-full grid-cols-1 bg-neutral-600">
            <SafeRenderWithErrorBlock
              title="Error loading featured product"
              spinnerClasses="bg-neutral-900"
            >
              <FeaturedProductSection />
            </SafeRenderWithErrorBlock>
          </Container>
        </Section>

        <Section classes="md:mb-24 lg:mb-42">
          <SafeRenderWithErrorBlock
            title="Error loading categories"
            containerClasses="mb-30"
          >
            <Container>
              <CategoryNavList />
            </Container>
          </SafeRenderWithErrorBlock>
        </Section>

        <Section classes="space-y-6 md:mb-24 md:space-y-8 lg:mb-53 lg:space-y-12">
          <SafeRenderWithErrorBlock title="Error loading showcase products">
            <ShowCaseProductsSection />
          </SafeRenderWithErrorBlock>
        </Section>
        <Section classes="md:mb-24 lg:mb-47">
          <BestGearSection />
        </Section>
      </main>
    </>
  );
};

// One preload per art-directed source, with the media query its <source> resolves to.
const preloadHero = (image: ResponsiveImageDTO) => {
  const sources = [
    [image.mobile.src, "(max-width: 767px)"],
    [image.tablet.src, "(min-width: 768px) and (max-width: 1023px)"],
    [image.desktop.src, "(min-width: 1024px)"],
  ] as const;
  for (const [href, media] of sources) {
    preload(href, { as: "image", fetchPriority: "high", media });
  }
};

export const clientLoader =
  (queryClient: QueryClient) => async (_context: LoaderFunctionArgs) => {
    try {
      const [featured] = await Promise.all([
        queryClient.ensureQueryData(getFeaturedProductQueryOptions()),
        queryClient.ensureQueryData(getShowCaseProductsQueryOptions()),
      ]);
      const image = featured.data.images.featuredImage;
      if (image) {
        preloadHero(image);
      }
    } catch (error) {
      throw normalizeError(error);
    }

    return null;
  };

export default Home;
