import { prisma } from "@repo/database";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createUser,
  resetDatabase,
  TEST_PASSWORD,
} from "./helpers/database.js";

const NEW_PASSWORD = "brand-new-password";

const storedPassword = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    omit: { password: false },
  });
  return user!.password;
};

beforeEach(resetDatabase);

describe("the user extension on update", () => {
  it("hashes a password given as a plain string", async () => {
    const user = await createUser();

    await prisma.user.update({
      where: { id: user.id },
      data: { password: NEW_PASSWORD, passwordConfirm: NEW_PASSWORD },
    });

    const hash = await storedPassword(user.id);
    expect(hash).not.toBe(NEW_PASSWORD);
    expect(await prisma.user.validatePassword(NEW_PASSWORD, hash)).toBe(true);
    expect(await prisma.user.validatePassword(TEST_PASSWORD, hash)).toBe(false);
  });

  it("hashes a password given as a field update operation", async () => {
    const user = await createUser();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: { set: NEW_PASSWORD },
        passwordConfirm: { set: NEW_PASSWORD },
      },
    });

    const hash = await storedPassword(user.id);
    expect(await prisma.user.validatePassword(NEW_PASSWORD, hash)).toBe(true);
  });

  it("rejects a password update that carries no string to hash", async () => {
    const user = await createUser();

    await expect(
      prisma.user.update({
        where: { id: user.id },
        data: { password: {}, passwordConfirm: {} },
      }),
    ).rejects.toThrow(TypeError);

    expect(
      await prisma.user.validatePassword(
        TEST_PASSWORD,
        await storedPassword(user.id),
      ),
    ).toBe(true);
  });

  it("stamps passwordChangedAt behind the clock so a fresh token stays valid", async () => {
    const user = await createUser();
    const before = Date.now();

    await prisma.user.update({
      where: { id: user.id },
      data: { password: NEW_PASSWORD, passwordConfirm: NEW_PASSWORD },
    });

    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updated!.passwordChangedAt!.getTime()).toBeLessThan(before);
  });

  it("leaves an update that touches neither password field alone", async () => {
    const user = await createUser();

    await prisma.user.update({
      where: { id: user.id },
      data: { name: "Renamed" },
    });

    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updated!.name).toBe("Renamed");
    expect(updated!.passwordChangedAt).toBeNull();
  });
});
