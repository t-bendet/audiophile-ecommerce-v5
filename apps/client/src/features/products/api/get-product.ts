import { api } from "@/lib/api-client";
import {
  TBaseHandler,
  TBaseRequestParams,
  TExtendsRequestParams,
  TFeaturedProduct,
  TProduct,
} from "@/types/api";
import { IdValidator } from "@/utils/validators";
import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import productKeys from "./product-keys";

// ** GetProductById

type TGetProductById = TBaseHandler<
  TProduct,
  TExtendsRequestParams<{ id: string }>
>;

const getProductById: TGetProductById = async ({ id, signal }) => {
  const response = await api.get(`/products/${id}`, { signal });
  return response.data.data;
};

export const getProductByIdQueryOptions = (id: string) =>
  queryOptions({
    queryKey: productKeys.detail(id),
    queryFn: ({ signal }: TBaseRequestParams) => getProductById({ id, signal }),
  });

// ** GetProductBySlug

type TGetProductBySlug = TBaseHandler<
  TProduct,
  TExtendsRequestParams<{ slug: string }>
>;

const getProductBySlug: TGetProductBySlug = async ({ slug, signal }) => {
  const response = await api.get(`/products/slug/${slug}`, { signal });
  return response.data.data;
};

export const getProductBySlugQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: productKeys.detail(slug),
    queryFn: ({ signal }: TBaseRequestParams) =>
      getProductBySlug({ slug, signal }),
  });

// ** GetFeaturedProduct

const FeaturedProductSchema = z.object({
  id: IdValidator("product"),
  slug: z.string(),
  description: z.string(),
  featuredImageText: z.string(),
  fullLabel: z.array(z.string()),
  isNewProduct: z.boolean(),
  shortLabel: z.string(),
  categoryId: IdValidator("category"),
  images: z.object({
    featuredImage: z.object({
      mobileSrc: z.string(),
      tabletSrc: z.string(),
      desktopSrc: z.string(),
      altText: z.string(),
      ariaLabel: z.string(),
    }),
  }),
}) satisfies z.Schema<TFeaturedProduct>;

type TGetFeaturedProduct = TBaseHandler<TFeaturedProduct>;

const getFeaturedProduct: TGetFeaturedProduct = async ({ signal }) => {
  const response = await api.get("/products/featured", { signal });
  const result = FeaturedProductSchema.safeParse(response.data.data);
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
