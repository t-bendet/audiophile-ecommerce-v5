import { SafeRenderWithErrorBlock } from "@/components/errors/safe-render-with-error-block";
import { BestGearSection } from "@/components/page-sections";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { getCategoriesQueryOptions } from "@/features/categories/api/get-categories";
import CategoryNavList from "@/features/categories/components/category-nav-list";
import { getProductsByCategoryQueryOptions } from "@/features/products/api/get-products";
import ProductsList from "@/features/products/components/products-list";
import { NAME } from "@repo/domain";
import { QueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { LoaderFunctionArgs, useParams } from "react-router";

const Category = () => {
  const { categoryName } = useParams<{ categoryName: NAME }>();
  const { data: ProductsResponse } = useSuspenseQuery(
    getProductsByCategoryQueryOptions(categoryName as NAME),
  );
  return (
    <>
      <header className="bg-neutral-900 py-8 md:py-24">
        <h1 className="tracking-500 text-center text-2xl font-bold uppercase md:text-4xl">
          {categoryName}
        </h1>
      </header>
      <main className="mt-16 md:mt-30 lg:mt-40">
        <ProductsList products={ProductsResponse.data} />

        <Section>
          <SafeRenderWithErrorBlock
            title="Error loading categories"
            containerClasses="mb-30"
          >
            <Container>
              <CategoryNavList />
            </Container>
          </SafeRenderWithErrorBlock>
        </Section>
        <Section>
          <BestGearSection />
        </Section>
      </main>
    </>
  );
};

export default Category;

// eslint-disable-next-line react-refresh/only-export-components
export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    await queryClient.ensureQueryData(
      getProductsByCategoryQueryOptions(params.categoryName as NAME),
    );
    await queryClient.prefetchQuery(getCategoriesQueryOptions());

    return null;
  };
