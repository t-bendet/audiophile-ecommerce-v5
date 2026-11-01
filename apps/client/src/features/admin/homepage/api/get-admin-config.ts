import productKeys from "@/features/products/api/product-keys";
import { getApi } from "@/lib/api-client";
import { TBaseHandler, TBaseRequestParams } from "@/types/api";
import {
  ConfigGetByIdResponse,
  ConfigGetByIdResponseSchema,
  ConfigUpdateByIdResponse,
  ConfigUpdateByIdResponseSchema,
} from "@repo/domain";
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { SlotIds } from "../slots";

export const configKeys = {
  all: ["config"] as const,
  detail: () => [...configKeys.all, "detail"] as const,
};

// ** GetConfig

type TGetConfig = TBaseHandler<ConfigGetByIdResponse>;

const getConfig: TGetConfig = async ({ signal }) => {
  const api = getApi();
  const response = await api.get("/config", { signal });
  const result = ConfigGetByIdResponseSchema.safeParse(response.data);
  if (result.success) return result.data;
  throw result.error;
};

/** The one site config: the four homepage slots and their product ids. */
export const configQueryOptions = () =>
  queryOptions({
    queryKey: configKeys.detail(),
    queryFn: ({ signal }: TBaseRequestParams) => getConfig({ signal }),
  });

// ** UpdateConfig

const updateConfig = async (
  configId: string,
  slots: SlotIds,
): Promise<ConfigUpdateByIdResponse> => {
  const api = getApi();
  const response = await api.patch(`/config/${configId}`, slots);
  const result = ConfigUpdateByIdResponseSchema.safeParse(response.data);
  if (result.success) return result.data;
  throw result.error;
};

/**
 * Save the four slots. The hero and the showcase read `/products/featured`
 * and `/products/show-case`, which live under the product keys, so the home
 * page shows the change on its next navigation.
 */
export const useUpdateConfig = (configId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slots: SlotIds) => updateConfig(configId, slots),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: configKeys.all });
      void queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
};
