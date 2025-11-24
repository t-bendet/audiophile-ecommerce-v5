import { z } from "zod";
import { IdValidator, NameValidator } from "@repo/validators";
export const CreateConfigSchema = z.object({
    body: z
        .object({
        name: NameValidator("Config"),
        featuredProduct: IdValidator("Featured Product"),
        showCaseProducts: z.object({
            cover: IdValidator("ShowcaseCover Product"),
            wide: IdValidator("ShowcaseWide Product"),
            grid: IdValidator("ShowcaseGrid Product"),
        }, { message: "Showcase products are required" }),
    })
        .strict(),
});
