import {
  AppError,
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  ErrorCode,
  sortFieldName,
  unknownFieldListMembers,
  type FieldListKey,
  type Meta,
} from "@repo/domain";

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

// A request schema rejects these first; this is the guard for a drifted whitelist.
const rejectUnknownMembers = (
  key: FieldListKey,
  value: string,
  allowedFields: readonly string[],
) => {
  const details = unknownFieldListMembers(key, value, allowedFields);
  if (details.length === 0) return;

  throw new AppError(
    `Validation failed: ${details.length} error(s)`,
    ErrorCode.VALIDATION_ERROR,
    undefined,
    details,
  );
};

// Field selection is a lower bound (ADR 0009): the list is checked against the
// whitelist and the full row is read, so no DTO member goes missing.
export const rejectUnknownFields = (
  fields: unknown,
  allowedFields: readonly string[],
): void => {
  if (typeof fields !== "string") return;

  rejectUnknownMembers("fields", fields, allowedFields);
};

export const parseOrderBy = <Field extends string>(
  sort: unknown,
  allowedFields: readonly Field[],
): OrderBy[] => {
  if (typeof sort !== "string") return [{ id: "desc" }];

  rejectUnknownMembers("sort", sort, allowedFields);

  return sort.split(",").map((field) => ({
    [sortFieldName(field)]: field.startsWith("-") ? "desc" : "asc",
  }));
};
