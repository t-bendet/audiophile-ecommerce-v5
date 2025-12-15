import { BestGearSection } from "@/components/sections";
import { Section } from "@/components/ui/section";
import FeaturedProductSection from "./featured-product-section";
import ShowCaseProductsSection from "./show-case-products-section";
import { Suspense } from "react";
import { Container } from "@/components/ui/container";
import LoadingSpinner from "@/components/layouts/loading-spinner";
import { ErrorBoundary } from "react-error-boundary";
import ErrorBlock from "@/components/errors/ErrorBlock";
import { getFeaturedProductQueryOptions } from "@/features/products/api/get-product";
import { getShowCaseProductsQueryOptions } from "@/features/products/api/get-products";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { getCategoriesQueryOptions } from "@/features/categories/api/get-categories";
import CategoryNavDropdown from "@/features/categories/components/category-nav-dropdown";

const Home = () => {
  const queryClient = useQueryClient();
  return (
    <>
      <main>
        <Section classes="mb-10 h-[calc(100vh-(var(--nav-bar-height)))] w-full bg-neutral-900 md:mb-24 lg:mb-30">
          <Container classes="grid h-full grid-cols-1 bg-neutral-600">
            <ErrorBoundary
              FallbackComponent={({ error, resetErrorBoundary }) => (
                <div className="flex items-center justify-center bg-neutral-900">
                  <ErrorBlock
                    title="Error loading featured product"
                    message={error.message}
                    onReset={resetErrorBoundary}
                  />
                </div>
              )}
              onReset={() => {
                queryClient.prefetchQuery(getFeaturedProductQueryOptions());
              }}
            >
              <Suspense fallback={<LoadingSpinner classes="bg-neutral-900" />}>
                <FeaturedProductSection />
              </Suspense>
            </ErrorBoundary>
          </Container>
        </Section>

        <Section classes="md:mb-24 lg:mb-42">
          <ErrorBoundary
            FallbackComponent={({ error, resetErrorBoundary }) => (
              <Container classes="mb-30">
                <div className="flex items-center justify-center">
                  <ErrorBlock
                    title={`Error loading categories`}
                    message={error.message}
                    onReset={resetErrorBoundary}
                  />
                </div>
              </Container>
            )}
            onReset={() => {
              queryClient.prefetchQuery(getCategoriesQueryOptions());
            }}
          >
            <Suspense fallback={<LoadingSpinner />}>
              <Container>
                <CategoryNavDropdown />
              </Container>
            </Suspense>
          </ErrorBoundary>
        </Section>

        <Section classes="space-y-6 md:mb-24 md:space-y-8 lg:mb-53 lg:space-y-12">
          <ErrorBoundary
            FallbackComponent={({ error, resetErrorBoundary }) => (
              <Container>
                <ErrorBlock
                  title="Error loading showcase products"
                  message={error.message}
                  onReset={resetErrorBoundary}
                />
              </Container>
            )}
            onReset={() => {
              queryClient.prefetchQuery(getShowCaseProductsQueryOptions());
            }}
          >
            <Suspense fallback={<LoadingSpinner />}>
              <ShowCaseProductsSection />
            </Suspense>
          </ErrorBoundary>
        </Section>

        <Section classes="md:mb-24 lg:mb-47">
          <BestGearSection />
        </Section>
      </main>
    </>
  );
};

export const clientLoader = (queryClient: QueryClient) => {
  queryClient.ensureQueryData(getFeaturedProductQueryOptions());
  queryClient.ensureQueryData(getShowCaseProductsQueryOptions());
  return null;
};

export default Home;
