import type { AxiosInstance } from "axios";
import { proto } from "./store";

export function installPrototypeLatency(api: AxiosInstance) {
  api.interceptors.request.use(async (request) => {
    const state = proto();
    const delay = "delay" in state ? state.delay : 0;
    if (typeof delay === "number" && delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    return request;
  });
}
