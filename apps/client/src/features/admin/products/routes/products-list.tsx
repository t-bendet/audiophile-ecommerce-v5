import { SafeRenderWithErrorBlock } from "@/components/errors/safe-render-with-error-block";
import { Skeleton } from "@/components/ui/skeleton";
import { getCategoriesQueryOptions } from "@/features/categories/api/get-categories";
import { getAllProductsQueryOptions } from "@/features/products/api/get-products";
import { QueryClient, useSuspenseQueries } from "@tanstack/react-query";
import { LoaderFunctionArgs, useSearchParams } from "react-router";
import { ListPagination } from "../../components/list-pagination";
import { ProductsTable } from "../components/products-table";
import { pageQuery, readPage, toSearchParams } from "../filters";

export default function AdminProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = readPage(searchParams);

  return (
    <SafeRenderWithErrorBlock title="Products" fallback={<ProductsSkeleton />}>
      <ProductsResults
        page={page}
        onPage={(next) => setSearchParams(toSearchParams(next))}
      />
    </SafeRenderWithErrorBlock>
  );
}

function ProductsResults({
  page,
  onPage,
}: {
  page: number;
  onPage: (page: number) => void;
}) {
  const [products, categories] = useSuspenseQueries({
    queries: [
      getAllProductsQueryOptions(pageQuery(page)),
      getCategoriesQueryOptions(),
    ],
  });
  const categoryNames = new Map(
    categories.data.data.map((category) => [category.id, category.name]),
  );

  if (products.data.data.length === 0) {
    return (
      <section className="flex flex-col items-start gap-4 rounded-lg bg-neutral-100 p-6">
        <h2 className="text-xs font-bold tracking-600 uppercase">
          Nothing here yet
        </h2>
        <p className="text-sm text-neutral-500">
          Products are published from the repo with db:sync.
        </p>
      </section>
    );
  }

  return (
    <>
      <ProductsTable
        products={products.data.data}
        categoryNames={categoryNames}
      />
      <ListPagination meta={products.data.meta} onPage={onPage} />
    </>
  );
}

function ProductsSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="flex h-16 items-center gap-6 rounded-lg bg-neutral-100 px-6"
        >
          <Skeleton className="size-10 rounded-md bg-neutral-200" />
          <Skeleton className="h-3 flex-1 rounded-full bg-neutral-200" />
          <Skeleton className="h-3 w-16 rounded-full bg-neutral-200" />
        </div>
      ))}
    </div>
  );
}

export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ request }: LoaderFunctionArgs) => {
    const page = readPage(new URL(request.url).searchParams);
    await Promise.all([
      queryClient.ensureQueryData(getAllProductsQueryOptions(pageQuery(page))),
      queryClient.ensureQueryData(getCategoriesQueryOptions()),
    ]);
    return null;
  };
