import ErrorBlock from "@/components/errors/ErrorBlock";
import LoadingSpinner from "@/components/layouts/loading-spinner";
import { BestGearSection } from "@/components/sections";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { getCategoriesQueryOptions } from "@/features/categories/api/get-categories";
import CategoryNavDropdown from "@/features/categories/components/category-nav-dropdown";
import { getProductsByCategoryQueryOptions } from "@/features/products/api/get-products";
import ProductsList from "@/features/products/components/products-list";
import ProductsListSkeleton from "@/features/products/components/products-list-skeleton";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { $Enums } from "@repo/database";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { LoaderFunctionArgs, useParams } from "react-router-dom";

// eslint-disable-next-line react-refresh/only-export-components
export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    const category = params.categoryName as $Enums.NAME;
    const query = getProductsByCategoryQueryOptions(category);
    queryClient.ensureQueryData(query);
    return null; // Ensure the loader returns null if no data is available
  };

const Category = () => {
  const { categoryName } = useParams<{ categoryName: $Enums.NAME }>();
  const queryClient = useQueryClient();
  return (
    <>
      <header className="bg-neutral-900 py-8 md:py-24">
        <h1 className="tracking-500 text-center text-2xl font-bold uppercase md:text-4xl">
          {categoryName}
        </h1>
      </header>
      <main className="mt-16 md:mt-30 lg:mt-40">
        <ErrorBoundary
          FallbackComponent={({ error, resetErrorBoundary }) => (
            <Container classes="mb-30">
              <div className="flex items-center justify-center">
                <ErrorBlock
                  title={`Error loading ${categoryName} products`}
                  message={error.message}
                  onReset={resetErrorBoundary}
                />
              </div>
            </Container>
          )}
          onReset={() => {
            queryClient.prefetchQuery(
              getProductsByCategoryQueryOptions(categoryName!),
            );
          }}
        >
          <Suspense fallback={<ProductsListSkeleton />}>
            <ProductsList categoryName={categoryName!} />
          </Suspense>
        </ErrorBoundary>

        <Section>
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
        <Section>
          <BestGearSection />
        </Section>
      </main>
    </>
  );
};

export default Category;
