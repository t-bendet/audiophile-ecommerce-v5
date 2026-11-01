import { ROLE, UserQueryParams } from "@repo/domain";
import { z, type ZodType } from "zod";

export type AdminUserFilters = Partial<
  Pick<UserQueryParams, "search" | "role" | "active" | "page">
>;

const FILTER_KEYS = ["search", "role", "active", "page"] as const;

const valid = <T>(schema: ZodType<T>, value: string | null): T | undefined => {
  if (!value) return undefined;
  const result = schema.safeParse(value);
  return result.success ? result.data : undefined;
};

/** The filters a URL carries. A value the server would reject is dropped. */
export const readUserFilters = (params: URLSearchParams): AdminUserFilters =>
  Object.fromEntries(
    Object.entries({
      search: valid(z.string().trim().min(1), params.get("search")),
      role: valid(z.enum(ROLE), params.get("role")),
      active: valid(z.stringbool(), params.get("active")),
      page: valid(z.coerce.number().int().positive(), params.get("page")),
    }).filter(([, value]) => value !== undefined),
  );

/** Only the named values, so the address and the query key stay short. */
export const toSearchParams = (filters: AdminUserFilters): URLSearchParams => {
  const params = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = filters[key];
    if (value === undefined || value === "") continue;
    if (key === "page" && value === 1) continue;
    params.set(key, String(value));
  }
  return params;
};

export const hasActiveFilters = (filters: AdminUserFilters) =>
  FILTER_KEYS.some((key) => key !== "page" && filters[key] !== undefined);
