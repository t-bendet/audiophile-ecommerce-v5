import {
  DEFAULT_STATS_PERIOD,
  STATS_PERIODS,
  StatsPeriodSchema,
  type StatsPeriod,
} from "@repo/domain";

/** The tab label for each period, in the order the tabs show them. */
export const PERIOD_LABELS: Record<StatsPeriod, string> = {
  "7d": "7 days",
  "30d": "30 days",
  "90d": "90 days",
  all: "All time",
};

export const PERIODS = STATS_PERIODS;

/** The period the URL names, or the default when it names none or one the server would reject. */
export const readPeriod = (searchParams: URLSearchParams): StatsPeriod => {
  const parsed = StatsPeriodSchema.safeParse(searchParams.get("period"));
  return parsed.success ? parsed.data : DEFAULT_STATS_PERIOD;
};

/** The default period is the bare URL, so the sidebar's link and the tab agree. */
export const toSearchParams = (period: StatsPeriod): URLSearchParams =>
  new URLSearchParams(period === DEFAULT_STATS_PERIOD ? {} : { period });
