import { getApi } from "@/lib/api-client";
import {
  TBaseHandler,
  TBaseRequestParams,
  TExtendsRequestParams,
} from "@/types/api";
import {
  NAME,
  Product,
  ProductGetAllResponse,
  ProductGetAllResponseSchema,
  ProductGetByCategoryResponse,
  ProductGetByCategoryResponseSchema,
  ProductGetRelatedResponse,
  ProductGetRelatedResponseSchema,
  ProductGetShowCaseResponse,
  ProductGetShowCaseResponseSchema,
} from "@repo/domain";
import { queryOptions } from "@tanstack/react-query";
import productKeys from "./product-keys";

// ** GetProducts

type productKeys = keyof Product;

type TProductFilters = Partial<Record<productKeys, string>>;

type TGetProducts = TBaseHandler<
  ProductGetAllResponse,
  TExtendsRequestParams<{ filters?: TProductFilters }>
>;

const getAllProducts: TGetProducts = async ({ filters, signal }) => {
  const api = getApi();
  const queryParams = new URLSearchParams(filters).toString();
  const response = await api.get(
    `/products${queryParams ? `?${queryParams}` : ""}`,
    {
      signal,
    },
  );
  const result = ProductGetAllResponseSchema.safeParse(response.data);
  if (result.success) {
    return result.data;
  } else {
    throw new Error("Failed to fetch Product");
  }
};

export const getAllProductsQueryOptions = (filters?: TProductFilters) =>
  queryOptions({
    queryKey: productKeys.list(filters),
    queryFn: ({ signal }: TBaseRequestParams) =>
      getAllProducts({ filters, signal }),
  });

// ** GetRelatedProducts

type TGetRelatedProducts = TBaseHandler<
  ProductGetRelatedResponse,
  TExtendsRequestParams<{ id: string }>
>;

const getRelatedProducts: TGetRelatedProducts = async ({ id, signal }) => {
  const api = getApi();
  const response = await api.get(`/products/related-products/${id}`, {
    signal,
  });
  const result = ProductGetRelatedResponseSchema.safeParse(response.data);
  if (result.success) {
    return result.data;
  } else {
    throw new Error("Failed to fetch related products");
  }
};

export const getRelatedProductsQueryOptions = (id: string) =>
  queryOptions({
    queryKey: productKeys.relatedProductsList(id),
    queryFn: ({ signal }: TBaseRequestParams) =>
      getRelatedProducts({ id, signal }),
  });

// ** GetProductsByCategory

type TGetProductsByCategory = TBaseHandler<
  ProductGetByCategoryResponse,
  TExtendsRequestParams<{ category: NAME }>
>;

const getProductsByCategory: TGetProductsByCategory = async ({
  category,
  signal,
}) => {
  const api = getApi();
  const response = await api.get(`/categories/${category}/products`, {
    signal,
  });
  const result = ProductGetByCategoryResponseSchema.safeParse(response.data);
  if (result.success) {
    return result.data;
  } else {
    throw new Error("Failed to fetch category products");
  }
};

export const getProductsByCategoryQueryOptions = (category: NAME) =>
  queryOptions({
    queryKey: productKeys.productsByCategoryList(category),
    queryFn: ({ signal }: TBaseRequestParams) =>
      getProductsByCategory({ category, signal }),
  });

// ** GetShowCaseProducts

type TGetShowCaseProducts = TBaseHandler<ProductGetShowCaseResponse>;

const getShowCaseProducts: TGetShowCaseProducts = async ({ signal }) => {
  const api = getApi();
  const response = await api.get("/products/show-case", { signal });
  const result = ProductGetShowCaseResponseSchema.safeParse(response.data);
  if (result.success) {
    return result.data;
  } else {
    throw new Error("Failed to fetch show case");
  }
};
export const getShowCaseProductsQueryOptions = () =>
  queryOptions({
    queryKey: productKeys.showCaseProductsList(),
    queryFn: ({ signal }: TBaseRequestParams) =>
      getShowCaseProducts({ signal }),
  });
