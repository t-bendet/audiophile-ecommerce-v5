import { api } from "@/lib/api-client";
import {
  $Enums,
  TBaseHandler,
  TBaseRequestParams,
  TExtendsRequestParams,
  TProduct,
  TRelatedProducts,
  TShowCaseProducts,
  TProductsByCategory,
} from "@/types/api";
import { IdValidator } from "@/utils/validators";
import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import productKeys from "./product-keys";

// ** GetProducts

type productKeys = keyof TProduct;

// TODO needs more work,also for the return type of the products
type TProductFilters = Partial<Record<productKeys, string>>;

type TGetProducts = TBaseHandler<
  TProduct[],
  TExtendsRequestParams<{ filters?: TProductFilters }>
>;

const getProducts: TGetProducts = ({ filters, signal }) => {
  const queryParams = new URLSearchParams(filters).toString();
  return api.get(`/products${queryParams ? `?${queryParams}` : ""}`, {
    signal,
  });
};

export const getProductsQueryOptions = (filters?: TProductFilters) =>
  queryOptions({
    queryKey: productKeys.list(filters),
    queryFn: ({ signal }: TBaseRequestParams) =>
      getProducts({ filters, signal }),
  });

// ** GetRelatedProducts

type TGetRelatedProducts = TBaseHandler<
  TRelatedProducts,
  TExtendsRequestParams<{ id: string }>
>;

const RelatedProductSchema = z.object({
  shortLabel: z.string(),
  id: IdValidator("product"),
  slug: z.string(),
  images: z.object({
    relatedProductImage: z.object({
      mobileSrc: z.string(),
      tabletSrc: z.string(),
      desktopSrc: z.string(),
      altText: z.string(),
      ariaLabel: z.string(),
    }),
  }),
});

const RelatedProductsSchema = z.array(
  RelatedProductSchema,
) satisfies z.Schema<TRelatedProducts>;

const getRelatedProducts: TGetRelatedProducts = async ({ id, signal }) => {
  const response = await api.get(`/products/related-products/${id}`, {
    signal,
  });
  const result = RelatedProductsSchema.safeParse(response.data.data);
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

const ProductByCategorySchema = z.object({
  description: z.string(),
  slug: z.string(),
  fullLabel: z.array(z.string()),
  id: IdValidator("product"),
  isNewProduct: z.boolean(),
  images: z.object({
    introImage: z.object({
      mobileSrc: z.string(),
      tabletSrc: z.string(),
      desktopSrc: z.string(),
      altText: z.string(),
      ariaLabel: z.string(),
    }),
  }),
});

const ProductsByCategorySchemas = z.array(
  ProductByCategorySchema,
) satisfies z.Schema<TProductsByCategory>;

type TGetProductsByCategory = TBaseHandler<
  TProductsByCategory,
  TExtendsRequestParams<{ category: $Enums.NAME }>
>;

const getProductsByCategory: TGetProductsByCategory = async ({
  category,
  signal,
}) => {
  const response = await api.get(`/products/category/${category}`, { signal });
  const result = ProductsByCategorySchemas.safeParse(response.data.data);
  if (result.success) {
    return result.data;
  } else {
    throw new Error("Failed to fetch category products");
  }
};

export const getProductsByCategoryQueryOptions = (category: $Enums.NAME) =>
  queryOptions({
    queryKey: productKeys.productsByCategoryList(category),
    queryFn: ({ signal }: TBaseRequestParams) =>
      getProductsByCategory({ category, signal }),
  });

// ** GetShowCaseProducts

const ShowCaseProductSchema = z.object({
  shortLabel: z.string(),
  slug: z.string(),
  id: IdValidator("product"),
  categoryId: IdValidator("category"),
  showCaseImageText: z.string().nullable(),
  images: z.object({
    showCaseImage: z.object({
      mobileSrc: z.string(),
      tabletSrc: z.string(),
      desktopSrc: z.string(),
      altText: z.string(),
      ariaLabel: z.string(),
    }),
  }),
});

const ShowCaseProductsSchema = z.object({
  cover: ShowCaseProductSchema,
  grid: ShowCaseProductSchema,
  wide: ShowCaseProductSchema,
}) satisfies z.Schema<TShowCaseProducts>;

type TGetShowCaseProducts = TBaseHandler<TShowCaseProducts>;

const getShowCaseProducts: TGetShowCaseProducts = async ({ signal }) => {
  const response = await api.get("/products/show-case", { signal });
  const result = ShowCaseProductsSchema.safeParse(response.data.data);
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
