import z from "zod";

export const IdValidator = (identifier: string = "Document") =>
  z
    .string({ message: `${identifier} Id is required` })
    .length(24, { message: "Invalid ID length" });

export const NameValidator = (identifier: string = "Document") =>
  z
    .string({ message: `${identifier} Name is required` })
    .min(2)
    .max(30);

export const EmailValidator = z
  .string({ message: "Email is required" })
  .email("Please provide a valid email!");

export const PasswordValidator = (identifier: string = "Password") => {
  return z
    .string({
      message: `${identifier} is required`,
    })
    .min(8)
    .max(20);
};
