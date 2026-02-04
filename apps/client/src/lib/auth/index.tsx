import { getApi } from "@/lib/api-client";
import { clearLocalCart, getLocalCart } from "@/lib/cart-storage";
import {
  TBaseHandler,
  TBaseRequestParams,
  TMutationHandler,
} from "@/types/api";
import {
  AuthCheckStatusResponse,
  AuthCheckStatusResponseSchema,
  AuthLoginRequest,
  AuthLogoutResponse,
  AuthLogoutResponseSchema,
  AuthSignUpRequest,
  SyncCartInput,
  SyncCartResponse,
  SyncCartResponseSchema,
  UserDTOResponse,
  UserDTOResponseSchema,
} from "@repo/domain";
import { QueryClient, queryOptions, useMutation } from "@tanstack/react-query";
import cartKeys from "@/features/cart/api/cart-keys";

export const USER_QUERY_KEY = "authenticated-user";
export const AUTH_STATUS_QUERY_KEY = "auth-status";
export const AUTH_LOGOUT_MUTATION_KEY = "auth-logout";
export const AUTH_LOGIN_MUTATION_KEY = "auth-login";
export const AUTH_SIGNUP_MUTATION_KEY = "auth-signup";

// api call definitions for auth (types, schemas, requests):
// these are not part of features as this is a module shared across features
// ** Get Auth Status

type TGetAuthStatus = TBaseHandler<AuthCheckStatusResponse>;

const getAuthStatus: TGetAuthStatus = async ({ signal }) => {
  const api = getApi();
  const response = await api.get("/auth/status", { signal });
  const result = AuthCheckStatusResponseSchema.safeParse(response.data);
  if (result.success) {
    return result.data;
  } else {
    throw result.error;
  }
};

export const getAuthStatusQueryOptions = () =>
  queryOptions({
    queryKey: [AUTH_STATUS_QUERY_KEY] as const,
    queryFn: ({ signal }: TBaseRequestParams) => getAuthStatus({ signal }),
    refetchOnMount: false, // Prevent refetch when component remounts during navigation
    staleTime: Infinity, // User data doesn't change often, keep it fresh indefinitely
    select: (data) => data?.data, // Return only the user DTO
  });

// ** Get User (Me)

type TGetUser = TBaseHandler<UserDTOResponse>;

const getUser: TGetUser = async ({ signal }) => {
  const api = getApi();
  const response = await api.get("/users/me", { signal });
  const result = UserDTOResponseSchema.safeParse(response.data);
  if (result.success) {
    return result.data;
  } else {
    throw result.error;
  }
};

export const getUserQueryOptions = () =>
  queryOptions({
    queryKey: [USER_QUERY_KEY] as const,
    queryFn: ({ signal }: TBaseRequestParams) => getUser({ signal }),
    refetchOnMount: false, // Prevent refetch when component remounts during navigation
    staleTime: Infinity, // User data doesn't change often, keep it fresh indefinitely
    select: (data) => {
      return data?.data;
    },
  });

// ** Logout User

type TPostLogoutUser = TMutationHandler<AuthLogoutResponse, {}>;

const logoutUser: TPostLogoutUser = async () => {
  const api = getApi();
  const response = await api.post("/auth/logout");
  const result = AuthLogoutResponseSchema.safeParse(response.data);
  if (result.success) {
    return result.data;
  } else {
    throw result.error;
  }
};

export const useLogoutUser = (queryClient: QueryClient) => {
  return useMutation({
    mutationKey: [AUTH_LOGOUT_MUTATION_KEY],
    mutationFn: logoutUser,
    onSuccess: (result) => {
      // Clear local cart on logout
      clearLocalCart();
      // Invalidate cart queries
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
      // Manually set the user data in the cache after a successful logout
      queryClient.setQueryData([USER_QUERY_KEY], result);
      return queryClient.invalidateQueries({
        queryKey: [AUTH_STATUS_QUERY_KEY],
      });
    },
  });
};

// ** Login User

type TPostLoginUser = TMutationHandler<UserDTOResponse, AuthLoginRequest>;

const postLoginUser: TPostLoginUser = async ({ email, password }) => {
  const api = getApi();
  const response = await api.post("/auth/login", {
    email,
    password,
  });
  const result = UserDTOResponseSchema.safeParse(response.data);
  if (result.success) {
    return result.data;
  } else {
    throw result.error;
  }
};

// ** Sync Cart - syncs local cart to server after login

type TSyncCart = TMutationHandler<SyncCartResponse, SyncCartInput>;

const syncCart: TSyncCart = async (input, _params) => {
  const api = getApi();
  const response = await api.post("/cart/sync", input);
  const result = SyncCartResponseSchema.safeParse(response.data);
  if (result.success) {
    return result.data;
  } else {
    throw result.error;
  }
};

export const useLogin = (queryClient: QueryClient) => {
  return useMutation({
    mutationFn: postLoginUser,
    mutationKey: [AUTH_LOGIN_MUTATION_KEY],
    onSuccess: async () => {
      // After successful login, sync local cart to server
      const localCart = getLocalCart();
      if (localCart.items.length > 0) {
        try {
          // Sync local cart items to server cart
          await syncCart(
            {
              items: localCart.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
              })),
            },
            {} // empty params object
          );
          // Clear local cart after successful sync
          clearLocalCart();
        } catch (error) {
          // Log error but don't block login - cart sync is not critical
          console.error("Failed to sync cart:", error);
        }
      }
      // Invalidate cart queries to fetch the merged server cart
      await queryClient.invalidateQueries({ queryKey: cartKeys.all });
      // Invalidate auth status
      await queryClient.invalidateQueries({
        queryKey: [AUTH_STATUS_QUERY_KEY],
      });
    },
  });
};

// ** Signup User

type TPostSignupUser = TMutationHandler<UserDTOResponse, AuthSignUpRequest>;

const postSignupUser: TPostSignupUser = async ({
  name,
  email,
  password,
  passwordConfirm,
}) => {
  const api = getApi();
  const response = await api.post("/auth/signup", {
    name,
    email,
    password,
    passwordConfirm,
  });

  const result = UserDTOResponseSchema.safeParse(response.data);
  if (result.success) {
    return result.data;
  } else {
    throw result.error;
  }
};

export const useSignup = (queryClient: QueryClient) => {
  return useMutation({
    mutationFn: postSignupUser,
    mutationKey: [AUTH_SIGNUP_MUTATION_KEY],
    onSuccess: () => {
      // Manually set the user data in the cache after a successful login
      return queryClient.invalidateQueries({
        queryKey: [AUTH_STATUS_QUERY_KEY],
      });
    },
  });
};
