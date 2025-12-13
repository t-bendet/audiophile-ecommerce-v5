import Axios, { InternalAxiosRequestConfig, isCancel } from "axios";
import { env } from "@/config/env";
import { paths } from "@/config/paths";
import { toast } from "@/hooks/use-toast";

function authRequestInterceptor(config: InternalAxiosRequestConfig) {
  if (config.headers) {
    config.headers.Accept = "application/json";
  }

  config.withCredentials = true;
  return config;
}

// TODO make this baseURL configurable
// TODO type the error response properly
// TODO add error handler for zod?

export const api = Axios.create({
  baseURL: `http://localhost:${env.PORT}/api/v1/`,
});

api.interceptors.request.use(authRequestInterceptor);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (isCancel(error)) {
      return;
    }
    const message = error.response?.data?.message || error.message;
    toast({
      type: "background",
      title: "Error",
      description: message,
      variant: "destructive",
    });

    if (error.response?.status === 401) {
      const searchParams = new URLSearchParams();
      const redirectTo =
        searchParams.get("redirectTo") || window.location.pathname;
      window.location.href = paths.auth.login.getHref(redirectTo);
    }
    console.log(error);

    return Promise.reject(error);
  },
);
