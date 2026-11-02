import { describe, expect, it } from "vitest";
import { isLastActiveAdmin } from "../src/features/admin/users/roles";

describe("the last active admin", () => {
  it("is an active admin when no other active admin exists", () => {
    expect(isLastActiveAdmin({ role: "ADMIN", active: true }, 1)).toBe(true);
    expect(isLastActiveAdmin({ role: "ADMIN", active: true }, 2)).toBe(false);
  });

  it("is never a shopper or a deactivated admin", () => {
    expect(isLastActiveAdmin({ role: "USER", active: true }, 1)).toBe(false);
    expect(isLastActiveAdmin({ role: "ADMIN", active: false }, 1)).toBe(false);
  });
});
