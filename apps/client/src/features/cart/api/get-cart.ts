import {
  addToLocalCart,
  clearLocalCart,
  getLocalCart,
  removeFromLocalCart,
  updateLocalCartItem,
} from "@/lib/cart-storage";
import {
  TBaseHandler,
  TBaseRequestParams,
  TMutationHandler,
} from "@/types/api";
import {
  AddToCartInput,
  AddToCartResponse,
  CartDTO,
  GetCartResponse,
  RemoveFromCartResponse,
  UpdateCartItemInput,
  UpdateCartItemResponse,
} from "@repo/domain";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import cartKeys from "./cart-keys";

// ** GetCart - Now returns local cart data

type TGetCart = TBaseHandler<GetCartResponse>;

const getCart: TGetCart = async () => {
  // Get cart from localStorage instead of API
  const localCart = getLocalCart();

  // Convert local cart to API response format
  const cartDTO: CartDTO = {
    id: "local-cart", // Dummy ID for local cart
    userId: "anonymous", // Anonymous user
    items: localCart.items.map((item, index) => ({
      ...item,
      id: item.id || `local-${index}`, // Generate ID if not present
    })),
    itemCount: localCart.itemCount,
    subtotal: localCart.subtotal,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return {
    success: true,
    message: "Cart retrieved successfully",
    timestamp: new Date().toISOString(),
    data: cartDTO,
  };
};

export const getCartQueryOptions = () =>
  queryOptions({
    queryKey: cartKeys.detail(),
    queryFn: ({ signal }: TBaseRequestParams) => getCart({ signal }),
  });

export const useCart = () => {
  return useQuery(getCartQueryOptions());
};

// ** AddToCart - Now uses local storage

type TAddToCart = TMutationHandler<
  AddToCartResponse,
  AddToCartInput & {
    productName: string;
    productSlug: string;
    productPrice: number;
    productImage: string;
  }
>;

const addToCart: TAddToCart = async ({
  productId,
  quantity,
  productName,
  productSlug,
  productPrice,
  productImage,
}) => {
  // Add to local storage
  const localCart = addToLocalCart(
    productId,
    productName,
    productSlug,
    productPrice,
    productImage,
    quantity
  );

  // Convert to API response format
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
    message: "Item added to cart",
    timestamp: new Date().toISOString(),
    data: cartDTO,
  };
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

// ** UpdateCartItem - Now uses local storage

type TUpdateCartItem = TMutationHandler<
  UpdateCartItemResponse,
  { productId: string } & UpdateCartItemInput
>;

const updateCartItem: TUpdateCartItem = async ({ productId, quantity }) => {
  // Update in local storage
  const localCart = updateLocalCartItem(productId, quantity);

  // Convert to API response format
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
    message: "Cart item updated",
    timestamp: new Date().toISOString(),
    data: cartDTO,
  };
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

// ** RemoveFromCart - Now uses local storage

type TRemoveFromCart = TMutationHandler<
  RemoveFromCartResponse,
  { productId: string }
>;

const removeFromCart: TRemoveFromCart = async ({ productId }) => {
  // Remove from local storage
  const localCart = removeFromLocalCart(productId);

  // Convert to API response format
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
    message: "Item removed from cart",
    timestamp: new Date().toISOString(),
    data: cartDTO,
  };
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

// ** ClearCart - Now uses local storage

type TClearCart = TBaseHandler<void>;

const clearCart: TClearCart = async () => {
  // Clear local storage
  clearLocalCart();
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
