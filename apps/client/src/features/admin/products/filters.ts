import { DEFAULT_LIMIT } from "@repo/domain";
import { z } from "zod";

/** The one thing the list URL carries. A value the server would reject is dropped. */
export const readPage = (params: URLSearchParams): number => {
  const result = z.coerce
    .number()
    .int()
    .positive()
    .safeParse(params.get("page"));
  return result.success ? result.data : 1;
};

/** The query the storefront's list factory takes; the first page stays implicit in the URL. */
export const pageQuery = (page: number) => ({
  page: String(page),
  limit: String(DEFAULT_LIMIT),
});

export const toSearchParams = (page: number): URLSearchParams =>
  new URLSearchParams(page === 1 ? {} : { page: String(page) });
