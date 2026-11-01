import {
  ADMIN_STORAGE_STATE,
  SEEDED_ADMIN,
  STORAGE_STATE,
  test as setup,
} from "./fixtures.js";

setup("the seeded shopper signs in", async ({ context, login }) => {
  await login();
  await context.storageState({ path: STORAGE_STATE });
});

setup("the seeded admin signs in", async ({ context, login }) => {
  await login(SEEDED_ADMIN);
  await context.storageState({ path: ADMIN_STORAGE_STATE });
});
