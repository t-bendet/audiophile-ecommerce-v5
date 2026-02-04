import { getApi } from "@/lib/api-client";
import {
  TBaseHandler,
  TBaseRequestParams,
  TMutationHandler,
} from "@/types/api";
import {
  AddToCartInput,
  AddToCartResponse,
  AddToCartResponseSchema,
  GetCartResponse,
  GetCartResponseSchema,
  RemoveFromCartResponse,
  RemoveFromCartResponseSchema,
  UpdateCartItemInput,
  UpdateCartItemResponse,
  UpdateCartItemResponseSchema,
} from "@repo/domain";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import cartKeys from "./cart-keys";

// ** GetCart

type TGetCart = TBaseHandler<GetCartResponse>;

const getCart: TGetCart = async ({ signal }) => {
  const api = getApi();
  const response = await api.get("/cart", { signal });
  const result = GetCartResponseSchema.safeParse(response.data);
  if (result.success) {
    return result.data;
  } else {
    throw result.error;
  }
};

export const getCartQueryOptions = () =>
  queryOptions({
    queryKey: cartKeys.detail(),
    queryFn: ({ signal }: TBaseRequestParams) => getCart({ signal }),
  });

export const useCart = () => {
  return useQuery(getCartQueryOptions());
};

// ** AddToCart

type TAddToCart = TMutationHandler<AddToCartResponse, AddToCartInput>;

const addToCart: TAddToCart = async ({ productId, quantity }) => {
  const api = getApi();
  const response = await api.post("/cart", { productId, quantity });
  const result = AddToCartResponseSchema.safeParse(response.data);
  if (result.success) {
    return result.data;
  } else {
    throw result.error;
  }
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addToCart,
    onSuccess: () => {
      // Invalidate cart query to refetch updated cart
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
};

// ** UpdateCartItem

type TUpdateCartItem = TMutationHandler<
  UpdateCartItemResponse,
  { cartItemId: string } & UpdateCartItemInput
>;

const updateCartItem: TUpdateCartItem = async ({ cartItemId, quantity }) => {
  const api = getApi();
  const response = await api.patch(`/cart/items/${cartItemId}`, { quantity });
  const result = UpdateCartItemResponseSchema.safeParse(response.data);
  if (result.success) {
    return result.data;
  } else {
    throw result.error;
  }
};

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCartItem,
    onSuccess: () => {
      // Invalidate cart query to refetch updated cart
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
};

// ** RemoveFromCart

type TRemoveFromCart = TMutationHandler<
  RemoveFromCartResponse,
  { cartItemId: string }
>;

const removeFromCart: TRemoveFromCart = async ({ cartItemId }) => {
  const api = getApi();
  const response = await api.delete(`/cart/items/${cartItemId}`);
  const result = RemoveFromCartResponseSchema.safeParse(response.data);
  if (result.success) {
    return result.data;
  } else {
    throw result.error;
  }
};

export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeFromCart,
    onSuccess: () => {
      // Invalidate cart query to refetch updated cart
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
};

// ** ClearCart

type TClearCart = TBaseHandler<void>;

const clearCart: TClearCart = async ({ signal }) => {
  const api = getApi();
  await api.delete("/cart", { signal });
};

export const useClearCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clearCart,
    onSuccess: () => {
      // Invalidate cart query to refetch empty cart
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
};
