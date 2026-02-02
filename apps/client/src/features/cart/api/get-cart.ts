import { getApi } from "@/lib/api-client";
import {
  TBaseHandler,
  TBaseRequestParams,
  TExtendsRequestParams,
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

type TAddToCart = TBaseHandler<
  AddToCartResponse,
  TExtendsRequestParams<AddToCartInput>
>;

const addToCart: TAddToCart = async ({ productId, quantity, signal }) => {
  const api = getApi();
  const response = await api.post(
    "/cart",
    { productId, quantity },
    { signal }
  );
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
    mutationFn: (input: AddToCartInput) => addToCart({ ...input }),
    onSuccess: () => {
      // Invalidate cart query to refetch updated cart
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
};

// ** UpdateCartItem

type TUpdateCartItem = TBaseHandler<
  UpdateCartItemResponse,
  TExtendsRequestParams<{ cartItemId: string } & UpdateCartItemInput>
>;

const updateCartItem: TUpdateCartItem = async ({
  cartItemId,
  quantity,
  signal,
}) => {
  const api = getApi();
  const response = await api.patch(
    `/cart/items/${cartItemId}`,
    { quantity },
    { signal }
  );
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
    mutationFn: (input: { cartItemId: string; quantity: number }) =>
      updateCartItem(input),
    onSuccess: () => {
      // Invalidate cart query to refetch updated cart
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
};

// ** RemoveFromCart

type TRemoveFromCart = TBaseHandler<
  RemoveFromCartResponse,
  TExtendsRequestParams<{ cartItemId: string }>
>;

const removeFromCart: TRemoveFromCart = async ({ cartItemId, signal }) => {
  const api = getApi();
  const response = await api.delete(`/cart/items/${cartItemId}`, { signal });
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
    mutationFn: (cartItemId: string) => removeFromCart({ cartItemId }),
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
    mutationFn: () => clearCart({}),
    onSuccess: () => {
      // Invalidate cart query to refetch empty cart
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
};
