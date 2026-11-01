import { describe, expect, it } from "vitest";
import {
  ADMIN_SECTIONS,
  activeAdminSection,
} from "../src/features/admin/sections";

// The header title and the active sidebar entry both come from this lookup,
// so a list must stay active on its detail pages and every section must sit
// under the guarded group.
describe("admin sections", () => {
  it("puts Orders first", () => {
    expect(ADMIN_SECTIONS[0]?.label).toBe("Orders");
    expect(activeAdminSection("/admin/orders")?.label).toBe("Orders");
  });

  it("keeps the orders entry active on an order's detail page", () => {
    expect(
      activeAdminSection("/admin/orders/0123456789abcdef01234567")?.label,
    ).toBe("Orders");
  });

  it("keeps every section under the guarded group", () => {
    for (const section of ADMIN_SECTIONS) {
      expect(section.href).toMatch(/^\/admin(\/|$)/);
    }
  });
});
