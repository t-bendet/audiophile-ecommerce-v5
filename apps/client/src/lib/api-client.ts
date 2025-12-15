import { toast } from "@/hooks/use-toast";
import Axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  isCancel,
} from "axios";

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
      const e: any = err instanceof Error ? err : new Error(String(err));
      e.name = "EnvValidationError";
      e.isEnvError = true;
      throw e;
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
            description:
              message || "Something went wrong. Please try again later.",
            variant: "destructive",
          });
        }

        return Promise.reject(error);
      },
    );
  }

  return apiInstance;
}
