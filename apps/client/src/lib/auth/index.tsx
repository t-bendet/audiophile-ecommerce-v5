import { getApi } from "@/lib/api-client";
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
  UserDTOResponse,
  UserDTOResponseSchema,
} from "@repo/domain";
import { QueryClient, queryOptions, useMutation } from "@tanstack/react-query";

export const USER_QUERY_KEY = "authenticated-user";
export const AUTH_STATUS_QUERY_KEY = "auth-status";

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

// TODO check how zod errors propagate here

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
    mutationKey: ["auth-logout"],
    mutationFn: logoutUser,
    onSuccess: () => {
      // Manually set the user data in the cache after a successful logout
      queryClient.setQueryData([USER_QUERY_KEY], null);
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

export const useLogin = (queryClient: QueryClient) => {
  return useMutation({
    mutationFn: postLoginUser,
    mutationKey: ["auth-login"],
    onSuccess: async () => {
      // Manually set the user data in the cache after a successful login
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
    mutationKey: ["auth-signup"],
    onSuccess: (user) => {
      // Manually set the user data in the cache after a successful login
      queryClient.setQueryData([USER_QUERY_KEY], user.data);
      return queryClient.invalidateQueries({
        queryKey: [AUTH_STATUS_QUERY_KEY],
      });
    },
  });
};
