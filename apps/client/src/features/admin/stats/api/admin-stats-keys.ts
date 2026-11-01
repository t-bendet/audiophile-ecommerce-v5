import type { StatsPeriod } from "@repo/domain";

const adminStatsKeys = {
  all: ["admin", "stats"] as const,
  period: (period: StatsPeriod) => [...adminStatsKeys.all, period] as const,
};

export default adminStatsKeys;
