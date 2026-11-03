// PROTOTYPE (#359): every API request waits the switcher's delay first, so loading states show.
import type { AxiosInstance } from "axios";
import { proto } from "./store";

export const installPrototypeLatency = (api: AxiosInstance) => {
  api.interceptors.request.use(async (config) => {
    const { delay } = proto();
    if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
    return config;
  });
};
