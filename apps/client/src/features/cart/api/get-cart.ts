import { getApi } from "@/lib/api-client";
import { getAuthStatusQueryOptions } from "@/lib/auth";
import {
  addToLocalCart,
  clearLocalCart,
  getLocalCart,
  removeFromLocalCart,
  updateLocalCartItem,
} from "@/lib/cart-storage";
import { TBaseHandler, TBaseRequestParams } from "@/types/api";
import {
  AddToCartInput,
  AddToCartResponse,
  AddToCartResponseSchema,
  CartDTO,
  ClearCartResponse,
  ClearCartResponseSchema,
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

// ===== Helper to check auth status =====

// TODO remove this to central auth

function getIsAuthenticated(queryClient: ReturnType<typeof useQueryClient>) {
  const authStatus = queryClient.getQueryData(
    getAuthStatusQueryOptions().queryKey,
  );
  return authStatus?.data?.isAuthenticated ?? false;
}

// ===== GetCart =====

type TGetCart = TBaseHandler<GetCartResponse>;

const getLocalCartResponse = (): GetCartResponse => {
  const localCart = getLocalCart();

  const cartDTO: CartDTO = {
    id: "local-cart",
    userId: "anonymous",
    items: localCart.items.map((item, index) => ({
      ...item,
      id: item.id || `local-${index}`,
    })),
    itemCount: localCart.itemCount,
    subtotal: localCart.subtotal,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return {
    success: true,
    timestamp: new Date().toISOString(),
    data: cartDTO,
  };
};

const getServerCart: TGetCart = async ({ signal }) => {
  const api = getApi();
  const response = await api.get("/cart", { signal });
  const result = GetCartResponseSchema.safeParse(response.data);
  if (result.success) {
    return result.data;
  } else {
    throw result.error;
  }
};

export const getCartQueryOptions = (isAuthenticated: boolean) =>
  queryOptions({
    queryKey: [...cartKeys.detail(), isAuthenticated] as const,
    queryFn: ({ signal }: TBaseRequestParams) =>
      isAuthenticated ? getServerCart({ signal }) : getLocalCartResponse(),
  });

export const useCart = () => {
  const queryClient = useQueryClient();
  const isAuthenticated = getIsAuthenticated(queryClient);

  return useQuery(getCartQueryOptions(isAuthenticated));
};

// ===== AddToCart =====

type TAddToCartInput = AddToCartInput & {
  cartLabel: string;
  productSlug: string;
  productPrice: number;
  productImage: string;
};

const addToLocalCartFn = async ({
  productId,
  quantity,
  cartLabel,
  productSlug,
  productPrice,
  productImage,
}: TAddToCartInput): Promise<AddToCartResponse> => {
  const localCart = addToLocalCart(
    productId,
    cartLabel,
    productSlug,
    productPrice,
    productImage,
    quantity,
  );

  const cartDTO: CartDTO = {
    id: "local-cart",
    userId: "anonymous",
    items: localCart.items.map((item, index) => ({
      ...item,
      id: item.id || `local-${index}`,
    })),
    itemCount: localCart.itemCount,
    subtotal: localCart.subtotal,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return {
    success: true,
    timestamp: new Date().toISOString(),
    data: cartDTO,
  };
};

const addToServerCart = async ({
  productId,
  quantity,
}: AddToCartInput): Promise<AddToCartResponse> => {
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
  const isAuthenticated = getIsAuthenticated(queryClient);

  return useMutation({
    mutationFn: (input: TAddToCartInput) =>
      isAuthenticated ? addToServerCart(input) : addToLocalCartFn(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
};

// ===== UpdateCartItem =====
// For local cart: uses productId
// For server cart: uses cartItemId (the id field in CartItemDTO)

type TUpdateCartItemInput = {
  productId: string; // Used for local cart
  cartItemId?: string; // Used for server cart (optional - can derive from productId in some cases)
} & UpdateCartItemInput;

const updateLocalCartItemFn = async ({
  productId,
  quantity,
}: TUpdateCartItemInput): Promise<UpdateCartItemResponse> => {
  const localCart = updateLocalCartItem(productId, quantity);

  const cartDTO: CartDTO = {
    id: "local-cart",
    userId: "anonymous",
    items: localCart.items.map((item, index) => ({
      ...item,
      id: item.id || `local-${index}`,
    })),
    itemCount: localCart.itemCount,
    subtotal: localCart.subtotal,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return {
    success: true,
    timestamp: new Date().toISOString(),
    data: cartDTO,
  };
};

const updateServerCartItem = async ({
  cartItemId,
  quantity,
}: {
  cartItemId: string;
  quantity: number;
}): Promise<UpdateCartItemResponse> => {
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
  const isAuthenticated = getIsAuthenticated(queryClient);

  return useMutation({
    mutationFn: (input: TUpdateCartItemInput) => {
      if (isAuthenticated) {
        if (!input.cartItemId) {
          throw new Error("cartItemId is required for authenticated users");
        }
        return updateServerCartItem({
          cartItemId: input.cartItemId,
          quantity: input.quantity,
        });
      }
      return updateLocalCartItemFn(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
};

// ===== RemoveFromCart =====
// For local cart: uses productId
// For server cart: uses cartItemId

type TRemoveFromCartInput = {
  productId: string; // Used for local cart
  cartItemId?: string; // Used for server cart
};

const removeFromLocalCartFn = async ({
  productId,
}: TRemoveFromCartInput): Promise<RemoveFromCartResponse> => {
  const localCart = removeFromLocalCart(productId);

  const cartDTO: CartDTO = {
    id: "local-cart",
    userId: "anonymous",
    items: localCart.items.map((item, index) => ({
      ...item,
      id: item.id || `local-${index}`,
    })),
    itemCount: localCart.itemCount,
    subtotal: localCart.subtotal,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return {
    success: true,
    timestamp: new Date().toISOString(),
    data: cartDTO,
  };
};

const removeFromServerCart = async ({
  cartItemId,
}: {
  cartItemId: string;
}): Promise<RemoveFromCartResponse> => {
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
  const isAuthenticated = getIsAuthenticated(queryClient);

  return useMutation({
    mutationFn: (input: TRemoveFromCartInput) => {
      if (isAuthenticated) {
        if (!input.cartItemId) {
          throw new Error("cartItemId is required for authenticated users");
        }
        return removeFromServerCart({ cartItemId: input.cartItemId });
      }
      return removeFromLocalCartFn(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
};

// ===== ClearCart =====

const clearLocalCartFn = async (): Promise<ClearCartResponse> => {
  clearLocalCart();
  return {
    success: true,
    timestamp: new Date().toISOString(),
    data: null,
  };
};

const clearServerCart = async (): Promise<ClearCartResponse> => {
  const api = getApi();
  const response = await api.delete("/cart");
  const result = ClearCartResponseSchema.safeParse(response.data);
  if (result.success) {
    return result.data;
  } else {
    throw result.error;
  }
};

export const useClearCart = () => {
  const queryClient = useQueryClient();
  const isAuthenticated = getIsAuthenticated(queryClient);

  return useMutation({
    mutationFn: () =>
      isAuthenticated ? clearServerCart() : clearLocalCartFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
};
