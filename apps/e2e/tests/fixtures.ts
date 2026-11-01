import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { expect, test as base, type APIRequestContext } from "@playwright/test";

// Absolute, because the Playwright agents run the suite from the repo root.
export const STORAGE_STATE = join(
  import.meta.dirname,
  "../playwright/.auth/user.json",
);

export const ADMIN_STORAGE_STATE = join(
  import.meta.dirname,
  "../playwright/.auth/admin.json",
);

export const SEEDED_SHOPPER = {
  email: "doe@example.com",
  password: "11111111",
} as const;

export const SEEDED_ADMIN = {
  email: "admin@example.com",
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
  fullLabel: string[];
};

export type CatalogueProduct = {
  id: string;
  slug: string;
  name: string;
  cartLabel: string;
  fullLabel: string[];
  price: number;
};

export type CategoryName = "Headphones" | "Earphones" | "Speakers";

export type CategoryProduct = {
  id: string;
  slug: string;
  fullLabel: string[];
};

export type Catalogue = {
  showCaseProducts: () => Promise<ShowCaseProducts>;
  featuredProduct: () => Promise<FeaturedProduct>;
  products: () => Promise<CatalogueProduct[]>;
  productBySlug: (slug: string) => Promise<CatalogueProduct>;
  productsByCategory: (category: CategoryName) => Promise<CategoryProduct[]>;
};

export type PlacedOrder = {
  shopper: Shopper;
  orderId: string;
};

type Fixtures = {
  login: (credentials?: Credentials) => Promise<void>;
  signUpFreshShopper: () => Promise<Shopper>;
  placeOrderAsFreshShopper: () => Promise<PlacedOrder>;
  resetCart: () => Promise<void>;
  catalogue: Catalogue;
};

const CHECKOUT = {
  shippingAddress: {
    fullName: "E2E Shopper",
    email: "e2e@example.com",
    phone: "+1 202 555 0100",
    address: "1 Audio Lane",
    city: "Hi-Fi City",
    state: "CA",
    zipCode: "90001",
    country: "United States",
  },
  billingAddress: {
    fullName: "E2E Shopper",
    address: "1 Audio Lane",
    city: "Hi-Fi City",
    state: "CA",
    zipCode: "90001",
    country: "United States",
  },
  paymentMethod: "Cash on Delivery",
};

const freshShopper = (): Shopper => {
  // `User.name` is unique too, and capped at 30 characters.
  const id = randomUUID();
  return {
    name: `e2e shopper ${id.slice(0, 8)}`,
    email: `e2e-${id}@example.com`,
    password: "11111111",
  };
};

const signUp = async (api: APIRequestContext, shopper: Shopper) => {
  await writeData(api, "post", "/api/v1/auth/signup", {
    ...shopper,
    passwordConfirm: shopper.password,
  });
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
      const shopper = freshShopper();
      await signUp(context.request, shopper);
      return shopper;
    });
  },

  // A separate cookie jar, so the page's own session (the admin's, say) is
  // untouched by the shopper who places the order. It starts empty on purpose:
  // a request context made inside a test inherits the test's storageState.
  placeOrderAsFreshShopper: async ({ playwright, baseURL }, use) => {
    await use(async () => {
      const api = await playwright.request.newContext({
        baseURL,
        storageState: { cookies: [], origins: [] },
      });
      try {
        const shopper = freshShopper();
        await signUp(api, shopper);
        const [product] = await readData<CatalogueProduct[]>(
          api,
          "/api/v1/products",
        );
        await writeData(api, "post", "/api/v1/cart", {
          productId: product.id,
          quantity: 1,
        });
        const response = await api.post("/api/v1/orders", { data: CHECKOUT });
        expect(response.status(), "POST /api/v1/orders").toBe(201);
        const body = (await response.json()) as { data: { id: string } };
        return { shopper, orderId: body.data.id };
      } finally {
        await api.dispose();
      }
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
      productsByCategory: (category) =>
        readData<CategoryProduct[]>(
          request,
          `/api/v1/categories/${category}/products`,
        ),
    });
  },
});

export { expect };
