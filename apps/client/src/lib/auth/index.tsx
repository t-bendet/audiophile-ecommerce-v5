import { configureAuth } from "react-query-auth";
import { Navigate, useLocation } from "react-router";

import { paths } from "@/config/paths";
import { getApi } from "@/lib/api-client";
import { TMutationHandler } from "@/types/api";
import {
  AuthLoginRequest,
  AuthSignUpRequest,
  AuthResponse,
  AuthResponseSchema,
  UserDTOResponse,
  UserDTOResponseSchema,
} from "@repo/domain";

// api call definitions for auth (types, schemas, requests):
// these are not part of features as this is a module shared across features

type TGetUser = () => Promise<UserDTOResponse>;

const getUser: TGetUser = async () => {
  const api = getApi();
  const response = await api.get("/users/me");
  const result = UserDTOResponseSchema.safeParse(response.data);
  if (result.success) {
    return result.data;
  } else {
    throw result.error;
  }
};

const logout = (): Promise<void> => {
  const api = getApi();
  return api.post("/auth/logout");
};

type TLoginUser = TMutationHandler<AuthResponse, AuthLoginRequest>;

const loginUser: TLoginUser = async ({ email, password }) => {
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

type TSignupUser = TMutationHandler<AuthResponse, AuthSignUpRequest>;

const signUpUser: TSignupUser = async ({
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

const authConfig = {
  userFn: async () => {
    const response = await getUser();
    return response.data; // Extract user from response wrapper
  },
  loginFn: async (body: AuthLoginRequest) => {
    const response = await loginUser(body, {});
    return response.data; // Extract user from response wrapper
  },
  registerFn: async (body: AuthSignUpRequest) => {
    const response = await signUpUser(body, {});
    return response.data; // Extract user from response wrapper
  },
  logoutFn: logout,
};

export const { useUser, useLogin, useLogout, useRegister, AuthLoader } =
  configureAuth(authConfig);

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useUser();
  const location = useLocation();

  if (!user.data) {
    return (
      <Navigate to={paths.auth.login.getHref(location.pathname)} replace />
    );
  }

  return children;
};
