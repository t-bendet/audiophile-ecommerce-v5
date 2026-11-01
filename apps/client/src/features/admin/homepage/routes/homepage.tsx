import { SafeRenderWithErrorBlock } from "@/components/errors/safe-render-with-error-block";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllProductsQueryOptions } from "@/features/products/api/get-products";
import { QueryClient, useSuspenseQueries } from "@tanstack/react-query";
import { configQueryOptions } from "../api/get-admin-config";
import { HomepageForm } from "../components/homepage-form";

// Every product, so each slot's select can offer the whole catalogue.
const ALL_PRODUCTS = { limit: "100" };

export default function AdminHomepagePage() {
  return (
    <SafeRenderWithErrorBlock title="Homepage" fallback={<SlotsSkeleton />}>
      <HomepageSlots />
    </SafeRenderWithErrorBlock>
  );
}

function HomepageSlots() {
  const [config, products] = useSuspenseQueries({
    queries: [configQueryOptions(), getAllProductsQueryOptions(ALL_PRODUCTS)],
  });

  return (
    <HomepageForm config={config.data.data} products={products.data.data} />
  );
}

function SlotsSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4" aria-busy="true">
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-80 rounded-lg bg-neutral-100" />
      ))}
    </div>
  );
}

export const clientLoader = (queryClient: QueryClient) => async () => {
  await Promise.all([
    queryClient.ensureQueryData(configQueryOptions()),
    queryClient.ensureQueryData(getAllProductsQueryOptions(ALL_PRODUCTS)),
  ]);
  return null;
};
