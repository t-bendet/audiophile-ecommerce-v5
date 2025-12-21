// ** Get All Categories

import { getApi } from "@/lib/api-client";
import { TBaseHandler, TBaseRequestParams } from "@/types/api";
import {
  AppError,
  CategoryGetAllResponse,
  CategoryGetAllResponseSchema,
  ErrorCode,
} from "@repo/domain";
import { queryOptions } from "@tanstack/react-query";
import z from "zod";

type TGetAllCategories = TBaseHandler<CategoryGetAllResponse>;

const getAllCategories: TGetAllCategories = async ({ signal }) => {
  const api = getApi();
  const response = await api.get("/categories", { signal });
  const result = CategoryGetAllResponseSchema.safeParse(response.data);
  if (result.success) {
    return result.data;
  } else {
    const details = result.error.issues.map((issue) => ({
      code: issue.code,
      message: issue.message,
      path: issue.path.length > 0 ? issue.path.map(String) : undefined,
    }));
    throw new AppError(
      `Failed to fetch categories: ${z.prettifyError(result.error)}`,
      ErrorCode.INTERNAL_ERROR,
      undefined,
      details,
    );
  }
};

export const getCategoriesQueryOptions = () =>
  queryOptions({
    queryKey: ["categories"],
    queryFn: ({ signal }: TBaseRequestParams) => getAllCategories({ signal }),
  });
