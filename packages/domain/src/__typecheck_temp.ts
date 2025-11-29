import type { Prisma } from "@repo/database";

// If CategoryCreateInput is 'any', these invalid fields won't error.
const bad: Prisma.CategoryCreateInput = {
  // name expects enum NAME, not arbitrary string
  name: "NotAnEnum",
  // thumbnail expects specific object shape, not arbitrary keys
  thumbnail: { foo: "bar" },
  // nonExistent should not exist
  nonExistent: 123,
};

type IsAny<T> = 0 extends 1 & T ? true : false;
type Check = IsAny<Prisma.CategoryCreateInput>;

// Prevent unused var elimination
export const __ok = !!bad as boolean;
