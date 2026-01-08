import { configureAuth } from "react-query-auth";
import { Navigate, useLocation } from "react-router";

import { paths } from "@/config/paths";
import { getApi } from "@/lib/api-client";
import { TMutationHandler } from "@/types/api";
import {
  AuthLoginRequest,
  AuthLoginResponse,
  AuthLoginResponseSchema,
  AuthSignUpRequest,
  AuthSignUpResponse,
  AuthSignUpResponseSchema,
  UserGetMeResponse,
  UserGetMeResponseSchema,
} from "@repo/domain";

// api call definitions for auth (types, schemas, requests):
// these are not part of features as this is a module shared across features

type TGetUser = () => Promise<UserGetMeResponse>;

const getUser: TGetUser = async () => {
  const api = getApi();
  const response = await api.get("/users/me");
  const result = UserGetMeResponseSchema.safeParse(response.data);
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

type TLoginUser = TMutationHandler<AuthLoginResponse, AuthLoginRequest>;

const loginUser: TLoginUser = async (body) => {
  const api = getApi();

  const response = await api.post("/auth/login", body);
  const result = AuthLoginResponseSchema.safeParse(response.data);
  if (result.success) {
    return result.data;
  } else {
    throw result.error;
  }
};

type TSignupUser = TMutationHandler<AuthSignUpResponse, AuthSignUpRequest>;

const signUpUser: TSignupUser = async (body) => {
  const api = getApi();
  const response = await api.post("/auth/signup", body);

  const result = AuthSignUpResponseSchema.safeParse(response.data);
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
