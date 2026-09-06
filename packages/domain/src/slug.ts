import z from "zod";

export const SlugValidator = (identifier: string = "Document") =>
  z
    .string({ message: `${identifier} Slug is required` })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: "Invalid slug format" })
    .min(3)
    .max(80);

export const slugify = (input: string): string =>
  input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
