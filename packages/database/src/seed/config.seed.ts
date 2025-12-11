import { prisma, Prisma } from "../index.js";

export type ProductCreateWithoutCategoryInput =
  Prisma.ProductCreateWithoutCategoryInput;

export type ProductCreateResult = Prisma.Result<
  typeof prisma.product,
  ProductCreateWithoutCategoryInput,
  "create"
>;
const seedConfigs = async (createdProducts: ProductCreateResult[]) => {
  console.log(`Start seeding configs...`);

  const createdProductsMap = createdProducts.reduce(
    (acc, category) => {
      acc[category.name] = category.id;
      return acc;
    },
    {} as Record<string, string>
  );

  const config = await prisma.config.create({
    data: {
      featuredProductId: createdProductsMap["xx99 mark two headphones"],
      showCaseProducts: {
        cover: createdProductsMap["zx9 speaker"],
        wide: createdProductsMap["zx7 speaker"],
        grid: createdProductsMap["yx1 wireless earphones"],
      },
      name: "productsConfig",
    },
  });

  console.log(`Created config with id: ${config.id}`);

  console.log(`Finished seeding configs.`);
  return config;
};

export default seedConfigs;
