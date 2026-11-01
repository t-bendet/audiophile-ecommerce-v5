import { describe, expect, it } from "vitest";
import {
  hasActiveFilters,
  readUserFilters,
  toSearchParams,
} from "../src/features/admin/users/filters";

describe("user list filters in the URL", () => {
  it("keeps valid filters and drops what the server would reject", () => {
    const params = new URLSearchParams(
      "search=ada&role=OWNER&active=false&page=2&fields=password",
    );

    expect(readUserFilters(params)).toEqual({
      search: "ada",
      active: false,
      page: 2,
    });
    expect(readUserFilters(new URLSearchParams("active=maybe"))).toEqual({});
  });

  it("writes only named values and leaves the first page implicit", () => {
    const params = toSearchParams({ role: "USER", active: true, page: 1 });

    expect(params.toString()).toBe("role=USER&active=true");
    expect(hasActiveFilters({ page: 3 })).toBe(false);
    expect(hasActiveFilters({ active: false })).toBe(true);
  });
});
