import { SafeRenderWithErrorBlock } from "@/components/errors/safe-render-with-error-block";
import FeaturedProductSection from "@/features/products/components/featured-product-section";
import ShowCaseProductsSection from "@/features/products/components/showcase-section";
import { BestGearSection } from "@/components/page-sections";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { getCategoriesQueryOptions } from "@/features/categories/api/get-categories";
import CategoryNavList from "@/features/categories/components/category-nav-list";
import { getFeaturedProductQueryOptions } from "@/features/products/api/get-product";
import { getShowCaseProductsQueryOptions } from "@/features/products/api/get-products";
import { QueryClient } from "@tanstack/react-query";
import { LoaderFunctionArgs } from "react-router";

const Home = () => {
  return (
    <>
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

export const clientLoader =
  (queryClient: QueryClient) => async (_context: LoaderFunctionArgs) => {
    queryClient.prefetchQuery(getFeaturedProductQueryOptions());
    queryClient.prefetchQuery(getShowCaseProductsQueryOptions());
    queryClient.prefetchQuery(getCategoriesQueryOptions());
    // console.log({context});

    return null;
  };

export default Home;
