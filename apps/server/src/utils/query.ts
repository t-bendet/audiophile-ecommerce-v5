import type { Meta } from "@repo/domain";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

export interface Pagination {
  page: number;
  limit: number;
  skip: number;
  take: number;
}

export type OrderBy = Record<string, "asc" | "desc">;

export const parsePagination = (query?: {
  page?: unknown;
  limit?: unknown;
}): Pagination => {
  const page =
    typeof query?.page !== "undefined"
      ? Number(query.page) || DEFAULT_PAGE
      : DEFAULT_PAGE;
  const limit =
    typeof query?.limit !== "undefined"
      ? Number(query.limit) || DEFAULT_LIMIT
      : DEFAULT_LIMIT;

  return { page, limit, skip: (page - 1) * limit, take: limit };
};

export const buildMeta = ({
  page,
  limit,
  total,
}: {
  page: number;
  limit: number;
  total: number;
}): Meta => {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

export const parseSelect = <Field extends string>(
  fields: unknown,
  allowedFields: readonly Field[],
): Record<Field, true> | undefined => {
  if (typeof fields !== "string" || !fields) return undefined;

  const select = {} as Record<Field, true>;
  for (const field of fields.split(",")) {
    if ((allowedFields as readonly string[]).includes(field)) {
      select[field as Field] = true;
    }
  }

  return Object.keys(select).length > 0 ? select : undefined;
};

export const parseOrderBy = <Field extends string>(
  sort: unknown,
  allowedFields: readonly Field[],
): OrderBy[] => {
  const defaultOrderBy: OrderBy[] = [{ id: "desc" }];
  if (typeof sort !== "string" || !sort) return defaultOrderBy;

  const orderBy = sort
    .split(",")
    .map((field) => {
      const isDescending = field.startsWith("-");
      const fieldName = isDescending ? field.substring(1) : field;
      if (!(allowedFields as readonly string[]).includes(fieldName)) {
        return undefined;
      }
      return { [fieldName]: isDescending ? "desc" : "asc" } satisfies OrderBy;
    })
    .filter((entry): entry is OrderBy => entry !== undefined);

  return orderBy.length > 0 ? orderBy : defaultOrderBy;
};
