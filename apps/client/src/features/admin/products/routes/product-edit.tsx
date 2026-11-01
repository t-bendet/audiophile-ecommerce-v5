import { SafeRenderWithErrorBlock } from "@/components/errors/safe-render-with-error-block";
import { Metadata } from "@/components/seo/metadata";
import { Skeleton } from "@/components/ui/skeleton";
import { paths } from "@/config/paths";
import { getCategoriesQueryOptions } from "@/features/categories/api/get-categories";
import { getProductByIdQueryOptions } from "@/features/products/api/get-product";
import { QueryClient, useSuspenseQueries } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Link, LoaderFunctionArgs, useParams } from "react-router";
import { ProductForm } from "../components/product-form";

export default function AdminProductPage() {
  const { productId = "" } = useParams();

  return (
    <>
      <Link
        to={paths.admin.products.getHref()}
        aria-label="Back to products"
        className="flex w-fit items-center gap-2 text-xs font-bold tracking-600 text-neutral-500 uppercase hover:text-primary-500"
      >
        <ArrowLeft className="size-4" />
        Products
      </Link>
      <SafeRenderWithErrorBlock title="Product" fallback={<EditSkeleton />}>
        <ProductEdit productId={productId} />
      </SafeRenderWithErrorBlock>
    </>
  );
}

function ProductEdit({ productId }: { productId: string }) {
  const [product, categories] = useSuspenseQueries({
    queries: [
      getProductByIdQueryOptions(productId),
      getCategoriesQueryOptions(),
    ],
  });

  return (
    <>
      <Metadata title={`${product.data.data.name} | Admin`} noIndex />
      <h2 className="text-lg font-bold tracking-200 uppercase">
        {product.data.data.name}
      </h2>
      <ProductForm
        product={product.data.data}
        categories={categories.data.data}
      />
    </>
  );
}

function EditSkeleton() {
  return (
    <div
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"
      aria-busy="true"
    >
      <Skeleton className="h-[40rem] rounded-lg bg-neutral-100" />
      <Skeleton className="h-72 rounded-lg bg-neutral-100" />
    </div>
  );
}

export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    const productId = params.productId ?? "";
    await Promise.all([
      queryClient.ensureQueryData(getProductByIdQueryOptions(productId)),
      queryClient.ensureQueryData(getCategoriesQueryOptions()),
    ]);
    return null;
  };
