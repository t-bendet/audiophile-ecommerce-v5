import { prisma } from "../client.js";
import seedCategories from "./categories.seed.js";
import seedConfigs from "./config.seed.js";
import seedProducts from "./products.seed.js";
import seedUsers from "./users.seed.js";

async function main() {
  console.log(`Start dropping old DB ...`);

  await prisma.$runCommandRaw({
    dropDatabase: 1,
  });
  console.log(`Finished dropping old DB ...`);

  await seedUsers();

  const createdCategories = await seedCategories();

  const createdProducts = await seedProducts(createdCategories);

  await seedConfigs(createdProducts);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
