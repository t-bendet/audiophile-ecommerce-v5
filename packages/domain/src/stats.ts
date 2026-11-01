import { z } from "zod";
import {
  createRequestSchema,
  SingleItemResponse,
  SingleItemResponseSchema,
} from "./common.js";
import { ImageVariantDTOSchema } from "./image.js";
import { OrderStatusSchema } from "./order.js";
import { IdValidator } from "./shared.js";

// * ===== Stats period =====

/** The windows the dashboard offers, newest first; there is no custom range. */
export const STATS_PERIODS = ["7d", "30d", "90d", "all"] as const;

export const StatsPeriodSchema = z.enum(STATS_PERIODS);

export type StatsPeriod = z.infer<typeof StatsPeriodSchema>;

export const DEFAULT_STATS_PERIOD: StatsPeriod = "30d";

const PERIOD_DAYS: Record<Exclude<StatsPeriod, "all">, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

/**
 * The instant a period starts, or `null` for all time. A period counts whole
 * days back from `now`, so `7d` is the last seven times 24 hours, not seven
 * calendar days.
 */
export const statsPeriodStart = (
  period: StatsPeriod,
  now: Date = new Date(),
): Date | null => {
  if (period === "all") return null;
  return new Date(now.getTime() - PERIOD_DAYS[period] * 24 * 60 * 60 * 1000);
};

// * ===== DTOs =====

/** A best seller: the product and the quantity sold across the period's order items. */
export const TopProductDTOSchema = z.object({
  id: IdValidator("Product"),
  name: z.string(),
  slug: z.string(),
  thumbnail: ImageVariantDTOSchema,
  quantity: z.number().int().positive(),
});

export type TopProductDTO = z.infer<typeof TopProductDTOSchema>;

/**
 * The shop over one period: every number is for orders created in it, except
 * `newUsers`, which counts the users created in it. Money is in the unit every
 * other DTO uses.
 */
export const StatsDTOSchema = z.object({
  period: StatsPeriodSchema,
  ordersCount: z.number().int().nonnegative(),
  /** A count per order status, zero included. */
  ordersByStatus: z.record(OrderStatusSchema, z.number().int().nonnegative()),
  /** The sum of `total` over Paid orders, whatever their order status. */
  revenue: z.number().int().nonnegative(),
  /** Up to five, highest quantity first. */
  topProducts: z.array(TopProductDTOSchema).max(5),
  newUsers: z.number().int().nonnegative(),
});

export type StatsDTO = z.infer<typeof StatsDTOSchema>;

// * ===== Input Schemas =====

export const StatsQueryParamsSchema = z
  .object({
    period: StatsPeriodSchema.default(DEFAULT_STATS_PERIOD),
  })
  .strict();

export type StatsQueryParams = z.infer<typeof StatsQueryParamsSchema>;

// * ===== Request Schemas =====

/**
 * Get stats request (admin only)
 */
export const GetStatsRequestSchema = createRequestSchema({
  query: StatsQueryParamsSchema,
});

export type GetStatsRequest = z.infer<typeof GetStatsRequestSchema>;

// * ===== Response Schemas =====

export type GetStatsResponse = SingleItemResponse<StatsDTO>;
export const GetStatsResponseSchema = SingleItemResponseSchema(StatsDTOSchema);
