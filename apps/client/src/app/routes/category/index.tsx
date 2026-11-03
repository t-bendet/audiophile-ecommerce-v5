import { SafeRenderWithErrorBlock } from "@/components/errors/safe-render-with-error-block";
import { BestGearSection } from "@/components/page-sections";
import { Metadata } from "@/components/seo/metadata";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import CategoryNavList from "@/features/categories/components/category-nav-list";
import { getProductsByCategoryQueryOptions } from "@/features/products/api/get-products";
import ProductsList from "@/features/products/components/products-list";
import { normalizeError } from "@/lib/errors/errors";
import { NAME } from "@repo/domain";
import { QueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { LoaderFunctionArgs, useNavigation, useParams } from "react-router";
import { Suspense } from "react";
import { CategorySkeleton } from "@/components/prototype/storefront-loading/skeletons";
import {
  loadersAwait,
  useProto,
} from "@/components/prototype/storefront-loading/store";

const Category = () => {
  const { categoryName } = useParams<{ categoryName: NAME }>();
  const navigation = useNavigation();

  const activeCategory =
    navigation.state === "loading" &&
    navigation.location?.pathname.startsWith("/category/")
      ? navigation.location.pathname.split("/").pop()!
      : categoryName!;
  const { data: ProductsResponse } = useSuspenseQuery(
    getProductsByCategoryQueryOptions(activeCategory as NAME),
  );
  return (
    <>
      <Metadata
        title={`${activeCategory} Audio`}
        description={`Shop ${activeCategory} from Audiophile.`}
      />
      <header className="bg-neutral-900 py-8 md:py-24">
        <h1 className="text-center text-2xl font-bold tracking-500 uppercase md:text-4xl">
          {activeCategory}
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

// PROTOTYPE (#359): B streams behind a route-level Suspense fallback.
const CategoryRoute = () => {
  const { loading } = useProto();
  const { categoryName } = useParams<{ categoryName: NAME }>();
  if (loading !== "B") return <Category />;
  return (
    <Suspense
      key={categoryName}
      fallback={<CategorySkeleton name={categoryName} />}
    >
      <Category />
    </Suspense>
  );
};

export default CategoryRoute;

export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    if (!loadersAwait()) {
      queryClient.prefetchQuery(
        getProductsByCategoryQueryOptions(params.categoryName as NAME),
      );
      return null;
    }
    try {
      await queryClient.ensureQueryData(
        getProductsByCategoryQueryOptions(params.categoryName as NAME),
      );
    } catch (error) {
      throw normalizeError(error);
    }

    return null;
  };
