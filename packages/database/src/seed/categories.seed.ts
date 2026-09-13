import { $Enums, prisma, Prisma } from "../index.js";

export type CategoryCreateInput = Prisma.CategoryCreateInput;

export type ReadOutput = Prisma.Result<
  typeof prisma.category,
  CategoryCreateInput,
  "create"
>;

export type CategoryName = $Enums.NAME;

// Dimensions are the files' real pixel sizes, held to them by `media:check`.
export const categoryData: CategoryCreateInput[] = [
  {
    name: "Headphones",
    thumbnail: {
      altText: "Headphones",
      image: {
        key: "categories/headphones/thumbnail.png",
        width: 438,
        height: 422,
      },
    },
    // products: {
    //   createMany: {
    //     data: headphonesProductData,
    //   },
    // },
  },
  {
    name: "Earphones",
    thumbnail: {
      altText: "Earphones",
      image: {
        key: "categories/earphones/thumbnail.png",
        width: 438,
        height: 380,
      },
    },
    // products: {
    //   createMany: {
    //     data: earphonesProductData,
    //   },
    // },
  },
  {
    name: "Speakers",
    thumbnail: {
      altText: "Speakers",
      image: {
        key: "categories/speakers/thumbnail.png",
        width: 438,
        height: 408,
      },
    },
    // products: {
    //   createMany: {
    //     data: speakersProductData,
    //   },
    // },
  },
];

const seedCategories = async () => {
  console.log(`Start seeding categories...`);

  const createdCategories: ReadOutput[] = [];

  for (const category of categoryData) {
    const createdCategory = await prisma.category.create({
      data: category,
    });
    createdCategories.push(createdCategory);
    console.log(`Created category with id: ${createdCategory.id}`);
  }

  console.log(`Finished seeding categories.`);
  return createdCategories;
};

export default seedCategories;
