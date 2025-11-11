// TODO prod script for database
// TODO soft delete for users needs a lot of work to be complete
// TODO Template literal types for error codes are awesome - https://www.youtube.com/shorts/zOseJFD447U,https://engineering.udacity.com/handling-errors-like-a-pro-in-typescript-d7a314ad4991,https://kentcdodds.com/blog/get-a-catch-block-error-message-with-typescript, https://medium.com/@turkishtechnology/error-handling-in-typescript-5b060e52b29b
// TODO switch to cloudinary upload images and products from dashboard? url or image upload
// TODO implement forgot password and reset password
// TODO rethink how to handle validateSchema message formatted errors
// TODO add update all details for admins (users, products, orders)
// TODO add errors for update same value
// TODO rethink server database logic,after separating server and client, maybe move to a separate package
// ** not urgent

// TODO yx1 wireless earphones does not have related product image
// TODO isNew as a virtual property - less then a year since arrival
// TODO services,split into different files
// TODO checkout prices return from backend
// TODO remove confirm password from user schema, and use it in backend logic
// TODO add null values to product seed/?
// TODO handel CORS in server

// ** Learning

// TODO one to many relation,one to one relation, many to many relation
// TODO go over prisma basic principles
// TODO go over prisma relations
// TODO go over prisma data types
// TODO go over express basic principles

// TODO consider if this asserts are useful, or if they are just a way to make typescript happy
// type User = {
//   id: number;
//   name: string;
// };

// function isUser(value: unknown): value is User {
//   return (
//     typeof value === "object" &&
//     value !== null &&
//     "id" in value &&
//     typeof value.id === "number" &&
//     "name" in value &&
//     typeof value.name === "string"
//   );
// }

// function saveToDatabase(user: User) {
//   console.log("Saving user:", user.name);
// }

// function assert(condition: unknown, msg?: string): asserts condition {
//   if (condition === false) throw new Error(msg);
// }

// function updateUser(userData: unknown) {
//   assert(isUser(userData), "Not a valid user");
//   saveToDatabase(userData); // ✅ Type-safe now!
// }

// updateUser({ id: 1, name: "John Doe" }); // ✅ Works

// function assertIsUser(value: unknown): asserts value is User {
//   if (!isUser(value)) {
//     throw new Error("Not a valid user");
//   }
// }

// function assertUser(value: unknown): asserts value is UserPublicInfo {
//   PublicInfoSchema.parse(value);
// }

// TODO add error assertion?

// function isPrismaError(
//   err: unknown
// ): asserts err is PrismaClientKnownRequestError {
//   if (!(err instanceof PrismaClientKnownRequestError)) {
//     throw new Error("Wrong error type");
//   }
// }
