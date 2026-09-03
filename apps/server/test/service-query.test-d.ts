import type {
  CategoryQueryParams,
  CategoryQueryParamsSchema,
  ProductQueryParams,
  ProductQueryParamsSchema,
  UserQueryParams,
  UserQueryParamsSchema,
} from "@repo/domain";
import { describe, expectTypeOf, it } from "vitest";
import type { z } from "zod";
import { categoryService } from "../src/services/category.service.js";
import { productService } from "../src/services/product.service.js";
import { userService } from "../src/services/user.service.js";

describe("list query params", () => {
  it("declares the same keys the route's schema parses", () => {
    expectTypeOf<
      keyof z.infer<typeof CategoryQueryParamsSchema>
    >().toEqualTypeOf<keyof CategoryQueryParams>();
    expectTypeOf<
      keyof z.infer<typeof ProductQueryParamsSchema>
    >().toEqualTypeOf<keyof ProductQueryParams>();
    expectTypeOf<keyof z.infer<typeof UserQueryParamsSchema>>().toEqualTypeOf<
      keyof UserQueryParams
    >();
  });

  it("accepts the filters the entity's route validates", () => {
    expectTypeOf(categoryService.getAll).toBeCallableWith({
      name: "Headphones",
      sort: "-createdAt",
      page: 2,
    });
    expectTypeOf(productService.getAll).toBeCallableWith({ name: "zx9" });
    expectTypeOf(userService.getAll).toBeCallableWith({ role: "ADMIN" });
  });

  it("rejects a filter the entity does not have", () => {
    // @ts-expect-error categories have no `role` filter
    categoryService.getAll({ role: "ADMIN" });
    // @ts-expect-error products have no `colour` filter
    productService.getAll({ colour: "red" });
    // @ts-expect-error users have no `name` filter
    userService.getAll({ name: "ada" });
  });

  it("rejects a filter value outside the validated enum", () => {
    // @ts-expect-error `name` is a category enum member
    categoryService.getAll({ name: "Turntables" });
    // @ts-expect-error `role` is a role enum member
    userService.getAll({ role: "SUPERUSER" });
  });
});
