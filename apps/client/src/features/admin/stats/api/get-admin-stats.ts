import { getApi } from "@/lib/api-client";
import {
  TBaseHandler,
  TBaseRequestParams,
  TExtendsRequestParams,
} from "@/types/api";
import {
  GetStatsResponse,
  GetStatsResponseSchema,
  type StatsPeriod,
} from "@repo/domain";
import { queryOptions } from "@tanstack/react-query";
import adminStatsKeys from "./admin-stats-keys";

type TGetAdminStats = TBaseHandler<
  GetStatsResponse,
  TExtendsRequestParams<{ period: StatsPeriod }>
>;

const getAdminStats: TGetAdminStats = async ({ period, signal }) => {
  const api = getApi();
  const response = await api.get(`/admin/stats?period=${period}`, { signal });
  const result = GetStatsResponseSchema.safeParse(response.data);
  if (result.success) return result.data;
  throw result.error;
};

export const adminStatsQueryOptions = (period: StatsPeriod) =>
  queryOptions({
    queryKey: adminStatsKeys.period(period),
    queryFn: ({ signal }: TBaseRequestParams) =>
      getAdminStats({ period, signal }),
  });
