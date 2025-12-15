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

export const api = Axios.create({
  baseURL: `http://localhost:${env.PORT}/api/v1/`,
});

api.interceptors.request.use(authRequestInterceptor);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Don't handle cancelled requests
    if (isCancel(error)) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    // Handle auth errors (let auth layer handle redirect)
    if (status === 401) {
      const searchParams = new URLSearchParams();
      const redirectTo =
        searchParams.get("redirectTo") || window.location.pathname;
      error.redirectTo = redirectTo;
      return Promise.reject(error);
    }

    // Don't show toast for expected client errors (4xx) - let UI handle them
    if (status && status >= 400 && status < 500) {
      return Promise.reject(error);
    }

    // Show toast only for server errors (5xx) or network errors
    if (!status || status >= 500) {
      toast({
        type: "background",
        title: "Server Error",
        description: message || "Something went wrong. Please try again later.",
        variant: "destructive",
      });
    }

    return Promise.reject(error);
  },
);
