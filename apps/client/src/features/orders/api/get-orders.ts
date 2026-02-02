import { getApi } from "@/lib/api-client";
import {
  TBaseHandler,
  TBaseRequestParams,
  TExtendsRequestParams,
} from "@/types/api";
import {
  CreateOrderInput,
  CreateOrderResponse,
  CreateOrderResponseSchema,
  GetOrderResponse,
  GetOrderResponseSchema,
  ListOrdersResponse,
  ListOrdersResponseSchema,
  OrderQueryParams,
} from "@repo/domain";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import cartKeys from "../../cart/api/cart-keys";
import orderKeys from "./order-keys";

// ** CreateOrder

type TCreateOrder = TBaseHandler<
  CreateOrderResponse,
  TExtendsRequestParams<CreateOrderInput>
>;

const createOrder: TCreateOrder = async ({
  shippingAddress,
  billingAddress,
  paymentMethod,
  signal,
}) => {
  const api = getApi();
  const response = await api.post(
    "/orders",
    { shippingAddress, billingAddress, paymentMethod },
    { signal }
  );
  const result = CreateOrderResponseSchema.safeParse(response.data);
  if (result.success) {
    return result.data;
  } else {
    throw result.error;
  }
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOrderInput) => createOrder({ ...input }),
    onSuccess: () => {
      // Invalidate both order and cart queries
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
};

// ** GetOrder

type TGetOrder = TBaseHandler<
  GetOrderResponse,
  TExtendsRequestParams<{ orderId: string }>
>;

const getOrder: TGetOrder = async ({ orderId, signal }) => {
  const api = getApi();
  const response = await api.get(`/orders/${orderId}`, { signal });
  const result = GetOrderResponseSchema.safeParse(response.data);
  if (result.success) {
    return result.data;
  } else {
    throw result.error;
  }
};

export const getOrderQueryOptions = (orderId: string) =>
  queryOptions({
    queryKey: orderKeys.detail(orderId),
    queryFn: ({ signal }: TBaseRequestParams) => getOrder({ orderId, signal }),
  });

export const useOrder = (orderId: string) => {
  return useQuery(getOrderQueryOptions(orderId));
};

// ** ListOrders

type TListOrders = TBaseHandler<
  ListOrdersResponse,
  TExtendsRequestParams<OrderQueryParams>
>;

const listOrders: TListOrders = async ({
  page,
  limit,
  status,
  paymentStatus,
  signal,
}) => {
  const api = getApi();
  const params = new URLSearchParams();
  if (page) params.append("page", page.toString());
  if (limit) params.append("limit", limit.toString());
  if (status) params.append("status", status);
  if (paymentStatus) params.append("paymentStatus", paymentStatus);

  const response = await api.get(`/orders?${params.toString()}`, { signal });
  const result = ListOrdersResponseSchema.safeParse(response.data);
  if (result.success) {
    return result.data;
  } else {
    throw result.error;
  }
};

export const listOrdersQueryOptions = (filters: OrderQueryParams = {}) =>
  queryOptions({
    queryKey: orderKeys.list(filters),
    queryFn: ({ signal }: TBaseRequestParams) =>
      listOrders({ ...filters, signal }),
  });

export const useOrders = (filters: OrderQueryParams = {}) => {
  return useQuery(listOrdersQueryOptions(filters));
};
