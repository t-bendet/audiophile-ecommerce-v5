// ** Get All Categories

import { api } from "@/lib/api-client";
import { TBaseHandler, TBaseRequestParams, TCategory } from "@/types/api";
import { IdValidator } from "@/utils/validators";
import { queryOptions } from "@tanstack/react-query";
import z from "zod";

// TODO solve this workaround for  date string

type TCategoryWithDateAsString = Omit<TCategory, "createdAt"> & {
  createdAt: string;
};

type TGetCategories = TBaseHandler<TCategoryWithDateAsString[]>;

// TODO make category union dynamic

const CategorySchema = z.object({
  id: IdValidator("product"),
  createdAt: z.string(),
  name: z.union([
    z.literal("Headphones"),
    z.literal("Earphones"),
    z.literal("Speakers"),
  ]),
  v: z.number(),
  thumbnail: z.object({
    altText: z.string(),
    ariaLabel: z.string(),
    src: z.string(),
  }),
});

const CategoriesSchema = z.array(CategorySchema) satisfies z.Schema<
  TCategoryWithDateAsString[]
>;

const getAllCategories: TGetCategories = async ({ signal }) => {
  const response = await api.get("/categories", { signal });
  const result = CategoriesSchema.safeParse(response.data.data);
  if (result.success) {
    return result.data;
  } else {
    throw new Error("Failed to fetch categories");
  }
};

export const getCategoriesQueryOptions = () =>
  queryOptions({
    queryKey: ["categories"],
    queryFn: ({ signal }: TBaseRequestParams) => getAllCategories({ signal }),
  });
