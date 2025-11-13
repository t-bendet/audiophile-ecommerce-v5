import { Prisma, prisma } from "../client.js";

const userData: Prisma.UserCreateInput[] = [
  {
    name: "admin",
    email: "admin@example.com",
    password: "11111111",
    passwordConfirm: "11111111",
    role: "ADMIN",
  },
  {
    name: "admin2",
    email: "admin2@example.com",
    password: "11111111",
    passwordConfirm: "11111111",
    role: "ADMIN",
  },
  {
    name: "admin3",
    email: "admin3@example.com",
    password: "11111111",
    passwordConfirm: "11111111",
    role: "ADMIN",
  },
  {
    name: "john doe",
    email: "doe@example.com",
    password: "11111111",
    passwordConfirm: "11111111",
  },
  {
    name: "john doe2",
    email: "doe2@example.com",
    password: "11111111",
    passwordConfirm: "11111111",
  },
  {
    name: "john doe3",
    email: "doe3@example.com",
    password: "11111111",
    passwordConfirm: "11111111",
  },
];

const seedUsers = async () => {
  console.log(`Start seeding users ...`);

  const createdUsers = [];

  for (const user of userData) {
    const createdUser = await prisma.user.create({
      data: user,
    });
    createdUsers.push(createdUser);
    console.log(`Created user with id: ${createdUser.id}`);
  }

  console.log(`Finished seeding users.`);

  return createdUsers;
};

export default seedUsers;
