import { z } from "zod";

// TODO duplicate from backend, refactor to share or accept duplicate

export const IdValidator = (identifier: string = "Document") =>
  z
    .string({ message: `${identifier} Id is required` })
    .length(24, { message: "Invalid ID length" });

export const NameValidator = (identifier: string = "Document") =>
  z
    .string({ message: `${identifier} Name is required` })
    .min(2)
    .max(30);
