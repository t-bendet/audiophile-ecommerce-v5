import { STORAGE_STATE, test as setup } from "./fixtures.js";

setup("the seeded shopper signs in", async ({ context, login }) => {
  await login();
  await context.storageState({ path: STORAGE_STATE });
});
