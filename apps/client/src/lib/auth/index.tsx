import { getApi } from "@/lib/api-client";
import {
  TBaseHandler,
  TBaseRequestParams,
  TMutationHandler,
} from "@/types/api";
import {
  AuthLoginRequest,
  AuthLogoutResponse,
  AuthLogoutResponseSchema,
  AuthResponse,
  AuthResponseSchema,
  AuthSignUpRequest,
  UserDTOResponse,
  UserDTOResponseSchema,
} from "@repo/domain";
import {
  QueryClient,
  queryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";

export const USER_QUERY_KEY = "authenticated-user";

// api call definitions for auth (types, schemas, requests):
// these are not part of features as this is a module shared across features

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
    queryKey: [USER_QUERY_KEY],
    queryFn: ({ signal }: TBaseRequestParams) => getUser({ signal }),
    // TODO refetchOnWindowFocus ,reconsider
    refetchOnMount: true, // Prevent refetch when component remounts during navigation
    // staleTime: Infinity, // User data doesn't change often, keep it fresh indefinitely
    select: (data) => data?.data, // Return only the user DTO
    // initialData: null,
  });

// ** Logout User

type TGetLogoutUser = TBaseHandler<AuthLogoutResponse>;

const logoutUser: TGetLogoutUser = async ({ signal }) => {
  const api = getApi();
  const response = await api.get("/auth/logout", { signal });
  const result = AuthLogoutResponseSchema.safeParse(response.data);
  if (result.success) {
    return result.data;
  } else {
    throw result.error;
  }
};

export const useLogoutUser = () => {
  return useQuery({
    queryKey: [USER_QUERY_KEY],
    queryFn: logoutUser,
    staleTime: Infinity, // User data usually doesn't go stale quickly
    select: (data) => data.data, // Return only the user DTO
  });
};

// ** Login User

type TPostLoginUser = TMutationHandler<AuthResponse, AuthLoginRequest>;

const postLoginUser: TPostLoginUser = async ({ email, password }) => {
  const api = getApi();
  const response = await api.post("/auth/login", {
    email,
    password,
  });
  const result = AuthResponseSchema.safeParse(response.data);
  if (result.success) {
    return result.data;
  } else {
    throw result.error;
  }
};

export const useLogin = (queryClient: QueryClient) => {
  return useMutation({
    mutationFn: postLoginUser,
    mutationKey: [USER_QUERY_KEY],
    onSuccess: (user) => {
      // Manually set the user data in the cache after a successful login
      queryClient.setQueryData([USER_QUERY_KEY], user.data);
    },
  });
};

// ** Signup User

type TPostSignupUser = TMutationHandler<AuthResponse, AuthSignUpRequest>;

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

  const result = AuthResponseSchema.safeParse(response.data);
  if (result.success) {
    return result.data;
  } else {
    throw result.error;
  }
};

export const useSignup = (queryClient: QueryClient) => {
  return useMutation({
    mutationFn: postSignupUser,
    mutationKey: [USER_QUERY_KEY],
    onSuccess: (user) => {
      // Manually set the user data in the cache after a successful login
      queryClient.setQueryData([USER_QUERY_KEY], user.data);
    },
  });
};
