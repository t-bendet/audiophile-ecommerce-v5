import { describe, expect, it } from "vitest";
import {
  ADMIN_SECTIONS,
  activeAdminSection,
} from "../src/features/admin/sections";

// The header title and the active sidebar entry both come from this lookup,
// so the root must own exactly its own URL and every section must sit under it.
describe("admin sections", () => {
  it("names the dashboard root at /admin", () => {
    expect(activeAdminSection("/admin")?.label).toBe("Dashboard");
  });

  it("does not let the root claim a nested admin page", () => {
    expect(activeAdminSection("/admin/anything")?.label).not.toBe("Dashboard");
  });

  it("keeps every section under the guarded group", () => {
    for (const section of ADMIN_SECTIONS) {
      expect(section.href).toMatch(/^\/admin(\/|$)/);
    }
  });
});
