import { $Enums, prisma, Prisma } from "../../index";

export type CategoryCreateInput = Prisma.CategoryCreateInput;

export type ReadOutput = Prisma.Result<
  typeof prisma.category,
  CategoryCreateInput,
  "create"
>;

export type CategoryName = $Enums.NAME;

const categoryData: CategoryCreateInput[] = [
  {
    name: "Headphones",
    thumbnail: {
      src: "https://i.ibb.co/6r3M9v9/image-category-thumbnail-headphones.png",
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
      src: "https://i.ibb.co/9Z0BpQC/image-category-thumbnail-earphones.png",
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
      src: "https://i.ibb.co/xfMTGtm/image-category-thumbnail-speakers.png",
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
