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

export const LabelValidator = (identifier: string = "Document") =>
  z
    .string({ message: `${identifier} Label is required` })
    .min(2)
    .max(30);

export const EmailValidator = z.email("Please provide a valid email!");

export const PasswordValidator = (identifier: string = "Password") => {
  return z
    .string({
      message: `${identifier} is required`,
    })
    .min(8)
    .max(20);
};

export const SlugValidator = (identifier: string = "Document") =>
  z
    .string({ message: `${identifier} Slug is required` })
    .regex(/^[a-z0-9-]+$/i, { message: "Invalid slug format" })
    .min(3)
    .max(80);
