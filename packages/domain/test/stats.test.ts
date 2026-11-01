import { describe, expect, it } from "vitest";
import {
  DEFAULT_STATS_PERIOD,
  STATS_PERIODS,
  StatsQueryParamsSchema,
  statsPeriodStart,
} from "../src/index.js";

describe("statsPeriodStart", () => {
  const now = new Date("2026-11-01T12:00:00.000Z");

  it("counts whole days back from now", () => {
    expect(statsPeriodStart("7d", now)).toEqual(
      new Date("2026-10-25T12:00:00.000Z"),
    );
    expect(statsPeriodStart("30d", now)).toEqual(
      new Date("2026-10-02T12:00:00.000Z"),
    );
    expect(statsPeriodStart("90d", now)).toEqual(
      new Date("2026-08-03T12:00:00.000Z"),
    );
  });

  it("has no start for all time", () => {
    expect(statsPeriodStart("all", now)).toBeNull();
  });
});

describe("StatsQueryParamsSchema", () => {
  it("defaults the period to thirty days", () => {
    expect(StatsQueryParamsSchema.parse({})).toEqual({
      period: DEFAULT_STATS_PERIOD,
    });
    expect(DEFAULT_STATS_PERIOD).toBe("30d");
  });

  it("accepts every offered period and rejects any other", () => {
    for (const period of STATS_PERIODS) {
      expect(StatsQueryParamsSchema.parse({ period })).toEqual({ period });
    }
    expect(StatsQueryParamsSchema.safeParse({ period: "1y" }).success).toBe(
      false,
    );
    expect(
      StatsQueryParamsSchema.safeParse({ period: "7d", from: "x" }).success,
    ).toBe(false);
  });
});
