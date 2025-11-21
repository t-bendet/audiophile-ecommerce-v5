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
