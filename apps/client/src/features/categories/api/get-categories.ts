// ** Get All Categories

import { getApi } from "@/lib/api-client";
import { TBaseHandler, TBaseRequestParams } from "@/types/api";
import {
  CategoryGetAllResponse,
  CategoryGetAllResponseSchema,
} from "@repo/domain";
import { queryOptions } from "@tanstack/react-query";

type TGetAllCategories = TBaseHandler<CategoryGetAllResponse>;

const getAllCategories: TGetAllCategories = async ({ signal }) => {
  const api = getApi();
  const response = await api.get("/categories", { signal });
  const result = CategoryGetAllResponseSchema.safeParse(response.data);
  if (result.success) {
    return result.data;
  } else {
    throw result.error;
  }
};

export const getCategoriesQueryOptions = () =>
  queryOptions({
    queryKey: ["categories"],
    queryFn: ({ signal }: TBaseRequestParams) => getAllCategories({ signal }),
    refetchOnMount: false, // Prevent refetch when component remounts during navigation
  });
