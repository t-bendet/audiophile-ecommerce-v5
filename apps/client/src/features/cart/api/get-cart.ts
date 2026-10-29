import { getApi } from "@/lib/api-client";
import { getAuthStatusQueryOptions } from "@/lib/auth";
import {
  addToGuestCart,
  clearGuestCart,
  getGuestCart,
  removeFromGuestCart,
  updateGuestCartItem,
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
  ImageVariantDTO,
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

function getIsAuthenticated(queryClient: ReturnType<typeof useQueryClient>) {
  const authStatus = queryClient.getQueryData(
    getAuthStatusQueryOptions().queryKey,
  );
  return authStatus?.data?.isAuthenticated ?? false;
}

// ===== GetCart =====

type TGetCart = TBaseHandler<GetCartResponse>;

const getGuestCartResponse = (): GetCartResponse => {
  const guestCart = getGuestCart();

  const cartDTO: CartDTO = {
    id: "local-cart",
    userId: "anonymous",
    items: guestCart.items.map((item, index) => ({
      ...item,
      id: item.id || `local-${index}`,
    })),
    itemCount: guestCart.itemCount,
    subtotal: guestCart.subtotal,
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
      isAuthenticated ? getServerCart({ signal }) : getGuestCartResponse(),
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
  productImage: ImageVariantDTO;
};

const addToGuestCartFn = async ({
  productId,
  quantity,
  cartLabel,
  productSlug,
  productPrice,
  productImage,
}: TAddToCartInput): Promise<AddToCartResponse> => {
  const guestCart = addToGuestCart(
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
    items: guestCart.items.map((item, index) => ({
      ...item,
      id: item.id || `local-${index}`,
    })),
    itemCount: guestCart.itemCount,
    subtotal: guestCart.subtotal,
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
      isAuthenticated ? addToServerCart(input) : addToGuestCartFn(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
};

// ===== UpdateCartItem =====
// For guest cart: uses productId
// For server cart: uses cartItemId (the id field in CartItemDTO)

type TUpdateCartItemInput = {
  productId: string; // Used for guest cart
  cartItemId?: string; // Used for server cart (optional - can derive from productId in some cases)
} & UpdateCartItemInput;

const updateGuestCartItemFn = async ({
  productId,
  quantity,
}: TUpdateCartItemInput): Promise<UpdateCartItemResponse> => {
  const guestCart = updateGuestCartItem(productId, quantity);

  const cartDTO: CartDTO = {
    id: "local-cart",
    userId: "anonymous",
    items: guestCart.items.map((item, index) => ({
      ...item,
      id: item.id || `local-${index}`,
    })),
    itemCount: guestCart.itemCount,
    subtotal: guestCart.subtotal,
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
      return updateGuestCartItemFn(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
};

// ===== RemoveFromCart =====
// For guest cart: uses productId
// For server cart: uses cartItemId

type TRemoveFromCartInput = {
  productId: string; // Used for guest cart
  cartItemId?: string; // Used for server cart
};

const removeFromGuestCartFn = async ({
  productId,
}: TRemoveFromCartInput): Promise<RemoveFromCartResponse> => {
  const guestCart = removeFromGuestCart(productId);

  const cartDTO: CartDTO = {
    id: "local-cart",
    userId: "anonymous",
    items: guestCart.items.map((item, index) => ({
      ...item,
      id: item.id || `local-${index}`,
    })),
    itemCount: guestCart.itemCount,
    subtotal: guestCart.subtotal,
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
      return removeFromGuestCartFn(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
};

// ===== ClearCart =====

const clearGuestCartFn = async (): Promise<ClearCartResponse> => {
  clearGuestCart();
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
      isAuthenticated ? clearServerCart() : clearGuestCartFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
};
