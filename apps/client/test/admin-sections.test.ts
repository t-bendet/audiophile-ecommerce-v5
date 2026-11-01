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

  it("puts Users second and keeps it active on a user's detail page", () => {
    expect(ADMIN_SECTIONS[1]?.label).toBe("Users");
    expect(activeAdminSection("/admin/users")?.label).toBe("Users");
    expect(
      activeAdminSection("/admin/users/0123456789abcdef01234567")?.label,
    ).toBe("Users");
  });

  it("puts Products third, active on an edit page, and Homepage fourth", () => {
    expect(ADMIN_SECTIONS[2]?.label).toBe("Products");
    expect(
      activeAdminSection("/admin/products/0123456789abcdef01234567")?.label,
    ).toBe("Products");
    expect(ADMIN_SECTIONS[3]?.label).toBe("Homepage");
    expect(activeAdminSection("/admin/homepage")?.label).toBe("Homepage");
  });

  it("keeps every section under the guarded group", () => {
    for (const section of ADMIN_SECTIONS) {
      expect(section.href).toMatch(/^\/admin(\/|$)/);
    }
  });
});
