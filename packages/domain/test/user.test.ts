import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { UserQueryParamsSchema } from "../src/user.js";

describe("UserQueryParamsSchema", () => {
  it("reads the admin filters from the query string", () => {
    expect(
      UserQueryParamsSchema.parse({
        search: " ada ",
        role: "USER",
        active: "false",
        page: "2",
      }),
    ).toEqual({ search: "ada", role: "USER", active: false, page: 2 });
  });

  it("rejects an unknown role, active or filter", () => {
    for (const query of [
      { role: "OWNER" },
      { active: "maybe" },
      { search: "  " },
      { email: "x" },
    ]) {
      expect(
        () => UserQueryParamsSchema.parse(query),
        JSON.stringify(query),
      ).toThrow(ZodError);
    }
  });
});
