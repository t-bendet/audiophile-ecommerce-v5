import { prisma } from "@repo/database";
import { ErrorCode } from "@repo/domain";
import { beforeEach, describe, expect, it } from "vitest";
import { categoryService } from "../src/services/category.service.js";
import { configService } from "../src/services/config.service.js";
import { productService } from "../src/services/product.service.js";
import { userService } from "../src/services/user.service.js";
import {
  createCategory,
  createConfig,
  createProduct,
  createUser,
  resetDatabase,
} from "./helpers/database.js";

// The whitelists are protected hooks, so each case drives the public `update`
// and reads the row back to prove what did and did not reach the database.

const STALE_DATE = new Date("2000-01-01T00:00:00.000Z");

beforeEach(resetDatabase);

describe("CategoryService.update", () => {
  it("writes the whitelisted fields", async () => {
    const category = await createCategory("Headphones");
    const thumbnail = {
      altText: "speakers alt",
      ariaLabel: "speakers aria",
      src: "https://cdn.example.com/speakers-thumb.jpg",
    };

    const dto = await categoryService.update(category.id, {
      name: "Speakers",
      thumbnail,
    });

    expect(dto).toMatchObject({ name: "Speakers", thumbnail });
  });

  it("drops createdAt and v", async () => {
    const category = await createCategory();

    await categoryService.update(category.id, {
      name: "Earphones",
      createdAt: STALE_DATE,
      v: 99,
    });

    const stored = await prisma.category.findUniqueOrThrow({
      where: { id: category.id },
    });
    expect(stored).toMatchObject({
      name: "Earphones",
      createdAt: category.createdAt,
      v: category.v,
    });
  });
});

describe("ProductService.update", () => {
  it("writes the fields outside the blacklist", async () => {
    const product = await createProduct({ price: 100 });

    const dto = await productService.update(product.id, {
      price: 250,
      description: "rewritten description",
    });

    expect(dto).toMatchObject({
      price: 250,
      description: "rewritten description",
    });
  });

  it("drops createdAt and v", async () => {
    const product = await createProduct({ price: 100 });

    await productService.update(product.id, {
      price: 250,
      createdAt: STALE_DATE,
      v: 99,
    });

    const stored = await prisma.product.findUniqueOrThrow({
      where: { id: product.id },
    });
    expect(stored).toMatchObject({
      price: 250,
      createdAt: product.createdAt,
      v: product.v,
    });
  });
});

describe("ConfigService.update", () => {
  it("writes the fields outside the blacklist", async () => {
    const config = await createConfig();

    const dto = await configService.update(config.id, {
      name: "renamed-config",
    });

    expect(dto).toMatchObject({ name: "renamed-config" });
  });

  it("drops createdAt and v", async () => {
    const config = await createConfig();

    await configService.update(config.id, {
      name: "renamed-config",
      createdAt: STALE_DATE,
      v: 99,
    });

    const stored = await prisma.config.findUniqueOrThrow({
      where: { id: config.id },
    });
    expect(stored).toMatchObject({
      name: "renamed-config",
      createdAt: config.createdAt,
      v: config.v,
    });
  });
});

describe("UserService.update", () => {
  it("writes the whitelisted fields", async () => {
    const user = await createUser();

    const dto = await userService.update(user.id, {
      name: "renamed-user",
      email: "renamed-user@example.com",
      role: "ADMIN",
      emailVerified: true,
    });

    expect(dto).toMatchObject({
      name: "renamed-user",
      email: "renamed-user@example.com",
      role: "ADMIN",
      emailVerified: true,
    });
  });

  it("writes the whitelisted active flag that soft-deletes a user", async () => {
    const user = await createUser();

    await userService.update(user.id, { active: false });

    await expect(userService.get(user.id)).rejects.toMatchObject({
      code: ErrorCode.NOT_FOUND,
    });
  });

  it("drops the credential fields, so an update cannot overwrite a password", async () => {
    const user = await createUser();
    const before = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      omit: { password: false, passwordConfirm: false },
    });

    await userService.update(user.id, {
      name: "renamed-user",
      password: "hijacked-password",
      passwordConfirm: "hijacked-password",
      passwordResetToken: "attacker-token",
      passwordChangedAt: STALE_DATE,
    });

    const stored = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      omit: { password: false, passwordConfirm: false },
    });
    expect(stored).toMatchObject({
      name: "renamed-user",
      password: before.password,
      passwordConfirm: before.passwordConfirm,
      passwordResetToken: null,
      passwordChangedAt: null,
    });
  });

  it("drops createdAt and v", async () => {
    const user = await createUser();

    await userService.update(user.id, {
      name: "renamed-user",
      createdAt: STALE_DATE,
      v: 99,
    });

    const stored = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    expect(stored).toMatchObject({
      name: "renamed-user",
      createdAt: user.createdAt,
      v: user.v,
    });
  });
});
