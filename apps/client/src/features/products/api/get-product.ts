import { api } from "@/lib/api-client";
import {
  TBaseHandler,
  TBaseRequestParams,
  TExtendsRequestParams,
} from "@/types/api";
import { queryOptions } from "@tanstack/react-query";
import productKeys from "./product-keys";
import {
  ProductGetByIdResponseSchema,
  ProductGetByIdResponse,
  ProductGetBySlugResponse,
  ProductGetBySlugResponseSchema,
  ProductGetFeaturedResponse,
  ProductGetFeaturedResponseSchema,
} from "@repo/domain";

// ** GetProductById

type TGetProductById = TBaseHandler<
  ProductGetByIdResponse,
  TExtendsRequestParams<{ id: string }>
>;

const getProductById: TGetProductById = async ({ id, signal }) => {
  const response = await api.get(`/products/${id}`, { signal });
  const result = ProductGetByIdResponseSchema.safeParse(response.data.data);
  if (result.success) {
    return result.data;
  } else {
    throw new Error("Failed to fetch Product");
  }
};

export const getProductByIdQueryOptions = (id: string) =>
  queryOptions({
    queryKey: productKeys.detail(id),
    queryFn: ({ signal }: TBaseRequestParams) => getProductById({ id, signal }),
  });

// ** GetProductBySlug

type TGetProductBySlug = TBaseHandler<
  ProductGetBySlugResponse,
  TExtendsRequestParams<{ slug: string }>
>;

const getProductBySlug: TGetProductBySlug = async ({ slug, signal }) => {
  const response = await api.get(`/products/slug/${slug}`, { signal });
  const result = ProductGetBySlugResponseSchema.safeParse(response.data.data);
  if (result.success) {
    return result.data;
  } else {
    throw new Error("Failed to fetch Product");
  }
};

export const getProductBySlugQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: productKeys.detail(slug),
    queryFn: ({ signal }: TBaseRequestParams) =>
      getProductBySlug({ slug, signal }),
  });

// ** GetFeaturedProduct

type TGetFeaturedProduct = TBaseHandler<ProductGetFeaturedResponse>;

const getFeaturedProduct: TGetFeaturedProduct = async ({ signal }) => {
  const response = await api.get("/products/featured", { signal });
  const result = ProductGetFeaturedResponseSchema.safeParse(response.data.data);
  if (result.success) {
    return result.data;
  } else {
    throw new Error("Failed to fetch featured product");
  }
};

export const getFeaturedProductQueryOptions = () =>
  queryOptions({
    queryKey: productKeys.featuredProductDetail(),
    queryFn: ({ signal }: TBaseRequestParams) => getFeaturedProduct({ signal }),
  });
