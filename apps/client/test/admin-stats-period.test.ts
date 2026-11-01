import { describe, expect, it } from "vitest";
import {
  PERIOD_LABELS,
  PERIODS,
  readPeriod,
  toSearchParams,
} from "../src/features/admin/stats/period";

// The period tabs read from and write to the URL, so a shared link opens on
// the same window and a value the server would reject never reaches it.
describe("admin stats period", () => {
  it("defaults to thirty days when the URL names no period", () => {
    expect(readPeriod(new URLSearchParams())).toBe("30d");
  });

  it("reads every offered period back", () => {
    for (const period of PERIODS) {
      expect(readPeriod(new URLSearchParams({ period }))).toBe(period);
    }
  });

  it("falls back to the default for a period the server would reject", () => {
    expect(readPeriod(new URLSearchParams({ period: "1y" }))).toBe("30d");
  });

  it("writes the default period as the bare URL", () => {
    expect(toSearchParams("30d").toString()).toBe("");
    expect(toSearchParams("7d").toString()).toBe("period=7d");
  });

  it("labels every period, in tab order", () => {
    expect(PERIODS.map((period) => PERIOD_LABELS[period])).toEqual([
      "7 days",
      "30 days",
      "90 days",
      "All time",
    ]);
  });
});
