import { SafeRenderWithErrorBlock } from "@/components/errors/SafeRenderWithErrorBlock";
import { BestGearSection } from "@/components/sections";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import CategoryNavDropdown from "@/features/categories/components/category-nav-dropdown";
import { getProductsByCategoryQueryOptions } from "@/features/products/api/get-products";
import ProductsList from "@/features/products/components/products-list";
import ProductsListSkeleton from "@/features/products/components/products-list-skeleton";
import { NAME } from "@repo/domain";
import { QueryClient } from "@tanstack/react-query";
import { LoaderFunctionArgs, useParams } from "react-router";

// eslint-disable-next-line react-refresh/only-export-components
export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    try {
      const category = params.categoryName as NAME;
      const query = getProductsByCategoryQueryOptions(category);
      await queryClient.ensureQueryData(query);
      return null;
    } catch (error) {
      throw error;
    }
  };

const Category = () => {
  const { categoryName } = useParams<{ categoryName: NAME }>();
  return (
    <>
      <header className="bg-neutral-900 py-8 md:py-24">
        <h1 className="tracking-500 text-center text-2xl font-bold uppercase md:text-4xl">
          {categoryName}
        </h1>
      </header>
      <main className="mt-16 md:mt-30 lg:mt-40">
        <SafeRenderWithErrorBlock
          title={`Error loading ${categoryName} products`}
          containerClasses="mb-30"
          fallback={<ProductsListSkeleton />}
        >
          <ProductsList categoryName={categoryName!} />
        </SafeRenderWithErrorBlock>

        <Section>
          <SafeRenderWithErrorBlock
            title="Error loading categories"
            containerClasses="mb-30"
          >
            <Container>
              <CategoryNavDropdown />
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
