import { getEnv } from "@/config/env";
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
 * Get or create Axios API client instance.
 * Uses pre-validated environment variables (must call initializeEnv() first).
 */
export function getApi(): AxiosInstance {
  if (!apiInstance) {
    const env = getEnv();

    apiInstance = Axios.create({
      baseURL: `${env.API_BASE_URL}${env.PORT}${env.API_POSTFIX}`,
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

        // Throw raw error; let React Query/components handle classification and UI decisions
        return Promise.reject(error);
      },
    );
  }

  return apiInstance;
}
