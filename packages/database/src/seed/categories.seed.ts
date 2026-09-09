import { $Enums, prisma, Prisma } from "../index.js";

export type CategoryCreateInput = Prisma.CategoryCreateInput;

export type ReadOutput = Prisma.Result<
  typeof prisma.category,
  CategoryCreateInput,
  "create"
>;

export type CategoryName = $Enums.NAME;

export const categoryData: CategoryCreateInput[] = [
  {
    name: "Headphones",
    thumbnail: {
      src: "https://audiophile-media.t-bendet.com/categories/headphones/thumbnail.png",
      altText: "Headphones",
      ariaLabel: "Headphones thumbnail",
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
      src: "https://audiophile-media.t-bendet.com/categories/earphones/thumbnail.png",
      altText: "Earphones",
      ariaLabel: "Earphones thumbnail",
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
      src: "https://audiophile-media.t-bendet.com/categories/speakers/thumbnail.png",
      altText: "Speakers",
      ariaLabel: "Speakers thumbnail",
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
