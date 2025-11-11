import { Prisma } from "@repo/database";
import z from "zod";
import { IdValidator, NameValidator } from "./common.schema";

// *  Config Create

export const CreateSchema = z.object({
  body: z
    .object({
      name: NameValidator("Config"),
      featuredProduct: IdValidator("Featured Product"),
      showCaseProducts: z.object(
        {
          cover: IdValidator("ShowcaseCover Product"),
          wide: IdValidator("ShowcaseWide Product"),
          grid: IdValidator("ShowcaseGrid Product"),
        },
        { message: "Showcase products are required" }
      ),
    })
    .strict() satisfies z.Schema<Prisma.ConfigCreateInput>,
});

export type CreateInput = z.infer<typeof CreateSchema.shape.body>;
