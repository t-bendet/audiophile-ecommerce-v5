import {
  AdminOrderQueryParams,
  IdValidator,
  OrderStatusSchema,
  PaymentStatusSchema,
} from "@repo/domain";
import { z, type ZodType } from "zod";

export type AdminOrderFilters = Partial<AdminOrderQueryParams>;

const FILTER_KEYS = [
  "status",
  "paymentStatus",
  "orderId",
  "customerEmail",
  "userId",
  "page",
] as const;

const valid = <T>(schema: ZodType<T>, value: string | null): T | undefined => {
  if (!value) return undefined;
  const result = schema.safeParse(value);
  return result.success ? result.data : undefined;
};

/** The filters a URL carries. A value the server would reject is dropped. */
export const readOrderFilters = (params: URLSearchParams): AdminOrderFilters =>
  Object.fromEntries(
    Object.entries({
      status: valid(OrderStatusSchema, params.get("status")),
      paymentStatus: valid(PaymentStatusSchema, params.get("paymentStatus")),
      orderId: valid(IdValidator("Order"), params.get("orderId")),
      customerEmail: valid(
        z.string().trim().min(1),
        params.get("customerEmail"),
      ),
      userId: valid(IdValidator("User"), params.get("userId")),
      page: valid(z.coerce.number().int().positive(), params.get("page")),
    }).filter(([, value]) => value !== undefined),
  );

/** Only the named values, so the address and the query key stay short. */
export const toSearchParams = (filters: AdminOrderFilters): URLSearchParams => {
  const params = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = filters[key];
    if (value === undefined || value === "") continue;
    if (key === "page" && value === 1) continue;
    params.set(key, String(value));
  }
  return params;
};

export const hasActiveFilters = (filters: AdminOrderFilters) =>
  FILTER_KEYS.some((key) => key !== "page" && filters[key] !== undefined);
