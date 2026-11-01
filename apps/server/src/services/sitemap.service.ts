import { prisma } from "@repo/database";

/**
 * The public pages a crawler can reach: the home page, each category page and
 * every product page by slug. Checkout, auth and account pages are not public.
 */
export class SitemapService {
  async getPublicPaths(): Promise<string[]> {
    const [categories, products] = await Promise.all([
      prisma.category.findMany({
        select: { name: true },
        orderBy: { name: "asc" },
      }),
      prisma.product.findMany({
        select: { slug: true },
        orderBy: { slug: "asc" },
      }),
    ]);

    return [
      "/",
      ...categories.map(({ name }) => `/category/${name}`),
      ...products.map(({ slug }) => `/product/${slug}`),
    ];
  }
}

export const sitemapService = new SitemapService();
