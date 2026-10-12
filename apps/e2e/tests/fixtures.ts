import { randomUUID } from "node:crypto";
import { expect, test as base, type APIRequestContext } from "@playwright/test";

export const STORAGE_STATE = "playwright/.auth/user.json";

export const SEEDED_SHOPPER = {
  email: "doe@example.com",
  password: "11111111",
} as const;

export type Credentials = {
  email: string;
  password: string;
};

export type Shopper = Credentials & {
  name: string;
};

export type ShowCaseProduct = {
  id: string;
  slug: string;
  shortLabel: string;
  showCaseImageText: string;
};

export type ShowCaseProducts = {
  showCaseCover: ShowCaseProduct | null;
  showCaseWide: ShowCaseProduct | null;
  showCaseGrid: ShowCaseProduct | null;
};

export type FeaturedProduct = {
  id: string;
  slug: string;
  fullLabel: string;
};

export type CatalogueProduct = {
  id: string;
  slug: string;
  name: string;
  fullLabel: string;
  price: number;
};

export type Catalogue = {
  showCaseProducts: () => Promise<ShowCaseProducts>;
  featuredProduct: () => Promise<FeaturedProduct>;
  products: () => Promise<CatalogueProduct[]>;
  productBySlug: (slug: string) => Promise<CatalogueProduct>;
};

type Fixtures = {
  login: (credentials?: Credentials) => Promise<void>;
  signUpFreshShopper: () => Promise<Shopper>;
  resetCart: () => Promise<void>;
  catalogue: Catalogue;
};

const readData = async <T>(
  api: APIRequestContext,
  path: string,
): Promise<T> => {
  const response = await api.get(path);
  expect(response.ok(), `GET ${path} returned ${response.status()}`).toBe(true);
  const body = (await response.json()) as { data: T };
  return body.data;
};

const writeData = async (
  api: APIRequestContext,
  method: "post" | "delete",
  path: string,
  data?: unknown,
) => {
  const response = await api[method](path, data ? { data } : undefined);
  expect(response.ok(), `${method} ${path} returned ${response.status()}`).toBe(
    true,
  );
};

export const test = base.extend<Fixtures>({
  // `context.request` shares the browser context's cookie jar, so an API login
  // leaves the page signed in.
  login: async ({ context }, use) => {
    await use(async (credentials = SEEDED_SHOPPER) => {
      await writeData(
        context.request,
        "post",
        "/api/v1/auth/login",
        credentials,
      );
    });
  },

  signUpFreshShopper: async ({ context }, use) => {
    await use(async () => {
      const shopper: Shopper = {
        name: "e2e shopper",
        email: `e2e-${randomUUID()}@example.com`,
        password: "11111111",
      };
      await writeData(context.request, "post", "/api/v1/auth/signup", {
        ...shopper,
        passwordConfirm: shopper.password,
      });
      return shopper;
    });
  },

  resetCart: async ({ context }, use) => {
    await use(async () => {
      await writeData(context.request, "delete", "/api/v1/cart");
    });
  },

  catalogue: async ({ request }, use) => {
    await use({
      showCaseProducts: () =>
        readData<ShowCaseProducts>(request, "/api/v1/products/show-case"),
      featuredProduct: () =>
        readData<FeaturedProduct>(request, "/api/v1/products/featured"),
      products: () => readData<CatalogueProduct[]>(request, "/api/v1/products"),
      productBySlug: (slug) =>
        readData<CatalogueProduct>(request, `/api/v1/products/slug/${slug}`),
    });
  },
});

export { expect };
