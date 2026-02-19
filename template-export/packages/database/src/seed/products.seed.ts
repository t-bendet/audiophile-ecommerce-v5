import { prisma, Prisma } from "../index.js";
import { CategoryName, ReadOutput } from "./categories.seed.js";

export type ProductCreateWithoutCategoryInput =
  Prisma.ProductCreateWithoutCategoryInput;

export type ProductCreateResult = Prisma.Result<
  typeof prisma.product,
  ProductCreateWithoutCategoryInput,
  "create"
>;

// Simplified product data for template
const sampleProducts: Record<CategoryName, ProductCreateWithoutCategoryInput[]> = {
  Headphones: [
    {
      name: "Sample Headphones",
      slug: "sample-headphones",
      cartLabel: "Sample Headphones",
      description: "High-quality wireless headphones with excellent sound.",
      price: 299,
      images: {
        thumbnail: {
          src: "https://placehold.co/600x400/png?text=Headphones",
          altText: "Sample headphones thumbnail",
          ariaLabel: "Sample headphones product image",
        },
      },
    },
  ],
  Speakers: [
    {
      name: "Sample Speaker",
      slug: "sample-speaker",
      cartLabel: "Sample Speaker",
      description: "Premium portable speaker with rich bass.",
      price: 499,
      images: {
        thumbnail: {
          src: "https://placehold.co/600x400/png?text=Speaker",
          altText: "Sample speaker thumbnail",
          ariaLabel: "Sample speaker product image",
        },
      },
    },
  ],
  Earphones: [
    {
      name: "Sample Earphones",
      slug: "sample-earphones",
      cartLabel: "Sample Earphones",
      description: "Compact earphones with noise cancellation.",
      price: 199,
      images: {
        thumbnail: {
          src: "https://placehold.co/600x400/png?text=Earphones",
          altText: "Sample earphones thumbnail",
          ariaLabel: "Sample earphones product image",
        },
      },
    },
  ],
};

export default async function seedProducts(categories: ReadOutput) {
  console.log(`Start seeding products ...`);

  for (const category of categories) {
    const productsData = sampleProducts[category.name];

    if (productsData) {
      for (const productData of productsData) {
        await prisma.product.create({
          data: {
            ...productData,
            category: {
              connect: {
                id: category.id,
              },
            },
          },
        });
      }
      console.log(`Created ${productsData.length} product(s) for ${category.name}`);
    }
  }

  console.log(`Finished seeding products.`);
}
