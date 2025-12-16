import Axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  isCancel,
} from "axios";
import { AppError, ErrorCode } from "@repo/domain";
import { toast } from "@/hooks/use-toast";
import { classifyHttpError } from "@/lib/errors";

function authRequestInterceptor(config: InternalAxiosRequestConfig) {
  if (config.headers) {
    config.headers.Accept = "application/json";
  }

  config.withCredentials = true;
  return config;
}

let apiInstance: AxiosInstance | null = null;

/**
 * Lazy initialization of API client.
 * Creates Axios instance on first call, ensuring env is read within error boundary context.
 * Subsequent calls return the cached instance.
 */
export async function getApi(): Promise<AxiosInstance> {
  if (!apiInstance) {
    // Import env inside function to defer evaluation until runtime
    // If env import/validation fails, annotate with a recognizable error
    let env: any;
    try {
      const mod = await import("@/config/env");
      env = mod.env;
    } catch (err: any) {
      throw new AppError(
        "An unexpected error occurred",
        ErrorCode.INTERNAL_ERROR,
      );
    }

    apiInstance = Axios.create({
      baseURL: `http://localhost:${env.PORT}/api/v1/`,
    });

    apiInstance.interceptors.request.use(authRequestInterceptor);

    apiInstance.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        // Don't handle cancelled requests
        if (isCancel(error)) {
          return Promise.reject(error);
        }

        const status = error.response?.status;

        // Handle auth errors (let auth layer handle redirect)
        if (status === 401) {
          const searchParams = new URLSearchParams();
          const redirectTo =
            searchParams.get("redirectTo") || window.location.pathname;
          error.redirectTo = redirectTo;
          return Promise.reject(error);
        }

        // For expected client errors (4xx), classify to AppError and let UI handle
        if (status && status >= 400 && status < 500) {
          return Promise.reject(classifyHttpError(error));
        }

        // Show generic toast for server errors (5xx) or network errors
        if (!status || status >= 500) {
          toast({
            type: "background",
            title: "Server Error",
            description: "An unexpected error occurred",
            variant: "destructive",
          });
        }

        return Promise.reject(classifyHttpError(error));
      },
    );
  }

  return apiInstance;
}
