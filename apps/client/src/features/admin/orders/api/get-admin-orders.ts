import orderKeys from "@/features/orders/api/order-keys";
import { getApi } from "@/lib/api-client";
import {
  TBaseHandler,
  TBaseRequestParams,
  TExtendsRequestParams,
} from "@/types/api";
import {
  AdminGetOrderResponse,
  AdminGetOrderResponseSchema,
  AdminListOrdersResponse,
  AdminListOrdersResponseSchema,
  UpdateOrderStatusInput,
  UpdateOrderStatusResponse,
  UpdateOrderStatusResponseSchema,
  UpdatePaymentStatusInput,
  UpdatePaymentStatusResponse,
  UpdatePaymentStatusResponseSchema,
} from "@repo/domain";
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { type ZodType } from "zod";
import { AdminOrderFilters, toSearchParams } from "../filters";
import adminOrderKeys from "./admin-order-keys";

const parseEnvelope = <T>(schema: ZodType<T>, data: unknown): T => {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  throw result.error;
};

// ** ListAdminOrders

type TListAdminOrders = TBaseHandler<
  AdminListOrdersResponse,
  TExtendsRequestParams<{ filters: AdminOrderFilters }>
>;

const listAdminOrders: TListAdminOrders = async ({ filters, signal }) => {
  const api = getApi();
  const response = await api.get(
    `/admin/orders?${toSearchParams(filters).toString()}`,
    { signal },
  );
  return parseEnvelope(AdminListOrdersResponseSchema, response.data);
};

export const adminOrdersQueryOptions = (filters: AdminOrderFilters = {}) =>
  queryOptions({
    queryKey: adminOrderKeys.list(filters),
    queryFn: ({ signal }: TBaseRequestParams) =>
      listAdminOrders({ filters, signal }),
  });

// ** GetAdminOrder

type TGetAdminOrder = TBaseHandler<
  AdminGetOrderResponse,
  TExtendsRequestParams<{ orderId: string }>
>;

const getAdminOrder: TGetAdminOrder = async ({ orderId, signal }) => {
  const api = getApi();
  const response = await api.get(`/admin/orders/${orderId}`, { signal });
  return parseEnvelope(AdminGetOrderResponseSchema, response.data);
};

export const adminOrderQueryOptions = (orderId: string) =>
  queryOptions({
    queryKey: adminOrderKeys.detail(orderId),
    queryFn: ({ signal }: TBaseRequestParams) =>
      getAdminOrder({ orderId, signal }),
  });

// ** UpdateOrderStatus / UpdatePaymentStatus

const updateOrderStatus = async (
  orderId: string,
  body: UpdateOrderStatusInput,
): Promise<UpdateOrderStatusResponse> => {
  const api = getApi();
  const response = await api.patch(`/orders/${orderId}/status`, body);
  return parseEnvelope(UpdateOrderStatusResponseSchema, response.data);
};

const updatePaymentStatus = async (
  orderId: string,
  body: UpdatePaymentStatusInput,
): Promise<UpdatePaymentStatusResponse> => {
  const api = getApi();
  const response = await api.patch(`/orders/${orderId}/payment-status`, body);
  return parseEnvelope(UpdatePaymentStatusResponseSchema, response.data);
};

/** A saved move refreshes every admin list and detail, and the shopper's own orders. */
const useInvalidateOrders = () => {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: adminOrderKeys.all });
    void queryClient.invalidateQueries({ queryKey: orderKeys.all });
  };
};

export const useUpdateOrderStatus = (orderId: string) => {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: (body: UpdateOrderStatusInput) =>
      updateOrderStatus(orderId, body),
    onSuccess: invalidate,
  });
};

export const useUpdatePaymentStatus = (orderId: string) => {
  const invalidate = useInvalidateOrders();
  return useMutation({
    mutationFn: (body: UpdatePaymentStatusInput) =>
      updatePaymentStatus(orderId, body),
    onSuccess: invalidate,
  });
};
