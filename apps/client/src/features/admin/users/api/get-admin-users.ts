import { getApi } from "@/lib/api-client";
import {
  TBaseHandler,
  TBaseRequestParams,
  TExtendsRequestParams,
} from "@/types/api";
import {
  UserDTOResponse,
  UserDTOResponseSchema,
  UserGetAllResponse,
  UserGetAllResponseSchema,
} from "@repo/domain";
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { type ZodType } from "zod";
import { AdminUserFilters, toSearchParams } from "../filters";
import adminUserKeys from "./admin-user-keys";

const parseEnvelope = <T>(schema: ZodType<T>, data: unknown): T => {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  throw result.error;
};

// ** ListAdminUsers

type TListAdminUsers = TBaseHandler<
  UserGetAllResponse,
  TExtendsRequestParams<{ filters: AdminUserFilters }>
>;

const listAdminUsers: TListAdminUsers = async ({ filters, signal }) => {
  const api = getApi();
  const response = await api.get(
    `/users?${toSearchParams(filters).toString()}`,
    { signal },
  );
  return parseEnvelope(UserGetAllResponseSchema, response.data);
};

export const adminUsersQueryOptions = (filters: AdminUserFilters = {}) =>
  queryOptions({
    queryKey: adminUserKeys.list(filters),
    queryFn: ({ signal }: TBaseRequestParams) =>
      listAdminUsers({ filters, signal }),
  });

// ** GetAdminUser

type TGetAdminUser = TBaseHandler<
  UserDTOResponse,
  TExtendsRequestParams<{ userId: string }>
>;

const getAdminUser: TGetAdminUser = async ({ userId, signal }) => {
  const api = getApi();
  const response = await api.get(`/users/${userId}`, { signal });
  return parseEnvelope(UserDTOResponseSchema, response.data);
};

export const adminUserQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: adminUserKeys.detail(userId),
    queryFn: ({ signal }: TBaseRequestParams) =>
      getAdminUser({ userId, signal }),
  });

// ** SetUserActive

const setUserActive = async (
  userId: string,
  active: boolean,
): Promise<UserDTOResponse> => {
  const api = getApi();
  const response = await api.patch(`/users/${userId}`, { active });
  return parseEnvelope(UserDTOResponseSchema, response.data);
};

/** Deactivate or reactivate; a saved change refreshes every admin user list and detail. */
export const useSetUserActive = (userId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (active: boolean) => setUserActive(userId, active),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminUserKeys.all });
    },
  });
};
