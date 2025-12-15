// ** Get All Categories

import { api } from "@/lib/api-client";
import { TBaseHandler, TBaseRequestParams } from "@/types/api";
import {
  CategoryGetAllResponse,
  CategoryGetAllResponseSchema,
} from "@repo/domain";
import { queryOptions } from "@tanstack/react-query";

type TGetAllCategories = TBaseHandler<CategoryGetAllResponse>;

const getAllCategories: TGetAllCategories = async ({ signal }) => {
  const response = await api.get("/categories", { signal });
  const result = CategoryGetAllResponseSchema.safeParse(response.data.data);
  if (result.success) {
    return result.data;
    ``;
  } else {
    throw new Error("Failed to fetch categories");
  }
};

export const getCategoriesQueryOptions = () =>
  queryOptions({
    queryKey: ["categories"],
    queryFn: ({ signal }: TBaseRequestParams) => getAllCategories({ signal }),
  });
