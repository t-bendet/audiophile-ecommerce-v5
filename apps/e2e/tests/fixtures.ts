import { randomUUID } from "node:crypto";
import { join } from "node:path";
import {
  expect,
  test as base,
  type APIRequestContext,
  type Page,
} from "@playwright/test";

// Absolute, because the Playwright agents run the suite from the repo root.
export const STORAGE_STATE = join(
  import.meta.dirname,
  "../playwright/.auth/user.json",
);

export const ADMIN_STORAGE_STATE = join(
  import.meta.dirname,
  "../playwright/.auth/admin.json",
);

// Playwright locks: tests that declare the same one never run at the same time,
// while everything else stays parallel.

/**
 * Held by every test that places an order and by the stats tests, whose
 * counts are the whole shop's, so a stats test sees exactly its own order.
 */
export const ORDERS_LOCK = "orders";

/**
 * Held by every test that changes the catalogue or the homepage slots and by
 * the storefront tests that assert what the catalogue API said a moment before.
 */
export const CATALOGUE_LOCK = "catalogue";

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
  images: ProductImagesDTO;
};

export type ImageVariantDTO = {
  src: string;
  width: number;
  height: number;
};

export type ResponsiveImageDTO = {
  altText: string;
  mobile: ImageVariantDTO;
  tablet: ImageVariantDTO;
  desktop: ImageVariantDTO;
};

export type ProductImagesDTO = {
  featuredImage: ResponsiveImageDTO | null;
  galleryImages: ResponsiveImageDTO[];
  introImage: ResponsiveImageDTO;
  primaryImage: ResponsiveImageDTO;
  showCaseImage: ResponsiveImageDTO | null;
  thumbnail: ImageVariantDTO & { altText: string };
  relatedProductImage: ResponsiveImageDTO;
};

export type IncludedItem = {
  item: string;
  quantity: number;
};

export type CatalogueProduct = {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  price: number;
  isNewProduct: boolean;
  cartLabel: string;
  shortLabel: string;
  fullLabel: string[];
  description: string;
  featuresText: string[];
  includedItems: IncludedItem[];
  featuredImageText: string | null;
  showCaseImageText: string | null;
  images: ProductImagesDTO;
};

/** The fields an admin edits, as `PATCH /api/v1/products/:id` takes them. */
export type ProductChanges = Partial<
  Pick<
    CatalogueProduct,
    | "name"
    | "price"
    | "categoryId"
    | "isNewProduct"
    | "description"
    | "featuresText"
    | "includedItems"
    | "cartLabel"
    | "shortLabel"
    | "fullLabel"
  >
>;

type ImageVariant = { key: string; width: number; height: number };

type ResponsiveImage = {
  altText: string;
  mobile: ImageVariant;
  tablet: ImageVariant;
  desktop: ImageVariant;
};

/** A product's images as the API stores them: bucket keys, not URLs. */
export type ProductImages = {
  featuredImage: ResponsiveImage | null;
  galleryImages: ResponsiveImage[];
  introImage: ResponsiveImage;
  primaryImage: ResponsiveImage;
  showCaseImage: ResponsiveImage | null;
  thumbnail: { altText: string; image: ImageVariant };
  relatedProductImage: ResponsiveImage;
};

/** The body `POST /api/v1/products` takes. */
export type ProductCreateBody = Omit<
  CatalogueProduct,
  "id" | "categoryId" | "images"
> & {
  images: ProductImages;
  category: { connect: { id: string } };
};

export type OrderStatus =
  "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export type AdminOrder = {
  id: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  total: number;
};

export type HomepageSlots = {
  featuredProductId: string;
  showCaseCoverId: string;
  showCaseWideId: string;
  showCaseGridId: string;
};

export type HomepageConfig = HomepageSlots & { id: string };

export type StatsPeriod = "7d" | "30d" | "90d" | "all";

export type Stats = {
  ordersCount: number;
  revenue: number;
};

/** Admin writes and reads through the API, on the browser context's session. */
export type AdminApi = {
  setOrderStatus: (orderId: string, status: OrderStatus) => Promise<AdminOrder>;
  setPaymentStatus: (
    orderId: string,
    paymentStatus: PaymentStatus,
  ) => Promise<AdminOrder>;
  updateProduct: (
    productId: string,
    changes: ProductChanges,
  ) => Promise<CatalogueProduct>;
  createProduct: (body: ProductCreateBody) => Promise<CatalogueProduct>;
  deleteProduct: (productId: string) => Promise<void>;
  config: () => Promise<HomepageConfig>;
  updateConfig: (
    configId: string,
    slots: Partial<HomepageSlots>,
  ) => Promise<HomepageConfig>;
  stats: (period: StatsPeriod) => Promise<Stats>;
};

export type CategoryName = "Headphones" | "Earphones" | "Speakers";

export type CategoryProduct = {
  id: string;
  slug: string;
  fullLabel: string[];
  isNewProduct: boolean;
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

export type PlacedOrders = {
  shopper: Shopper;
  /** Oldest first, in the order they were placed. */
  orderIds: string[];
};

export type ShopperOrder = {
  id: string;
  items: { productId: string; productName: string }[];
};

/** A message the server's test outbox holds, as `GET /api/v1/test/outbox` answers it. */
export type OutboxMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
  idempotencyKey: string;
};

type Fixtures = {
  login: (credentials?: Credentials) => Promise<void>;
  signUpFreshShopper: () => Promise<Shopper>;
  placeOrdersAsFreshShopper: (count: number) => Promise<PlacedOrders>;
  placeOrderAsFreshShopper: () => Promise<PlacedOrder>;
  placeOrder: (product?: Pick<CatalogueProduct, "id">) => Promise<string>;
  listOrders: () => Promise<ShopperOrder[]>;
  outbox: (to: string) => Promise<OutboxMessage[]>;
  resetCart: () => Promise<void>;
  catalogue: Catalogue;
  admin: AdminApi;
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

export const freshShopper = (): Shopper => {
  // `User.name` is unique too, and capped at 30 characters.
  const id = randomUUID();
  return {
    name: `e2e shopper ${id.slice(0, 8)}`,
    email: `e2e-${id}@example.com`,
    password: "11111111",
  };
};

/** Holds every request to `url` until the returned release is called. */
export const holdRoute = async (page: Page, url: string) => {
  let release!: () => void;
  const held = new Promise<void>((resolve) => (release = resolve));
  await page.route(url, async (route) => {
    await held;
    await route.continue();
  });
  return release;
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

const writeData = async <T = void>(
  api: APIRequestContext,
  method: "post" | "patch" | "delete",
  path: string,
  data?: unknown,
): Promise<T> => {
  const response = await api[method](path, data ? { data } : undefined);
  expect(response.ok(), `${method} ${path} returned ${response.status()}`).toBe(
    true,
  );
  const text = await response.text();
  return (text ? (JSON.parse(text) as { data: T }).data : undefined) as T;
};

// Every disposable product's name starts with this, so catalogue reads can
// leave it out and a spec's "first product" stays a seeded one.
const DISPOSABLE_PRODUCT_NAME = "e2e disposable";

const isSeeded = (product: Pick<CatalogueProduct, "name">) =>
  !product.name.startsWith(DISPOSABLE_PRODUCT_NAME);

const seededProducts = async (api: APIRequestContext) =>
  (await readData<CatalogueProduct[]>(api, "/api/v1/products")).filter(
    isSeeded,
  );

// The API answers with image URLs; it stores and accepts bucket keys, which
// are the URL's path.
const keyOf = ({ src, width, height }: ImageVariantDTO): ImageVariant => ({
  key: decodeURIComponent(new URL(src).pathname.slice(1)),
  width,
  height,
});

const responsiveKeysOf = ({
  altText,
  mobile,
  tablet,
  desktop,
}: ResponsiveImageDTO): ResponsiveImage => ({
  altText,
  mobile: keyOf(mobile),
  tablet: keyOf(tablet),
  desktop: keyOf(desktop),
});

/** A product's images as keys again, ready to send back to the API. */
export const imageKeysOf = (images: ProductImagesDTO): ProductImages => ({
  featuredImage: images.featuredImage && responsiveKeysOf(images.featuredImage),
  galleryImages: images.galleryImages.map(responsiveKeysOf),
  introImage: responsiveKeysOf(images.introImage),
  primaryImage: responsiveKeysOf(images.primaryImage),
  showCaseImage: images.showCaseImage && responsiveKeysOf(images.showCaseImage),
  thumbnail: {
    altText: images.thumbnail.altText,
    image: keyOf(images.thumbnail),
  },
  relatedProductImage: responsiveKeysOf(images.relatedProductImage),
});

/**
 * A new product with unique names and slug, in `source`'s category and with
 * `source`'s images. The server does not check the bucket, so reusing keys is
 * how a spec gets a product with an image the seed has no spare of. Delete it
 * before the test ends; `catalogue.products()` leaves it out meanwhile.
 */
export const disposableProduct = (
  source: CatalogueProduct,
): ProductCreateBody => {
  const id = randomUUID().slice(0, 8);
  return {
    name: `${DISPOSABLE_PRODUCT_NAME} ${id}`,
    slug: `e2e-disposable-${id}`,
    cartLabel: `E2E ${id}`,
    shortLabel: `E2E Disposable ${id}`,
    fullLabel: ["E2E Disposable", id],
    description: "A product an E2E spec creates and deletes again.",
    price: source.price,
    isNewProduct: false,
    featuresText: source.featuresText,
    includedItems: source.includedItems.map(({ item, quantity }) => ({
      item,
      quantity,
    })),
    featuredImageText: source.featuredImageText,
    showCaseImageText: source.showCaseImageText,
    images: imageKeysOf(source.images),
    category: { connect: { id: source.categoryId } },
  };
};

// Orders whatever the context's cart holds plus one of `product`, the first
// catalogue product by default, and returns the order id.
const placeOrder = async (
  api: APIRequestContext,
  product?: Pick<CatalogueProduct, "id">,
): Promise<string> => {
  const productId = product?.id ?? (await seededProducts(api))[0].id;
  await writeData(api, "post", "/api/v1/cart", { productId, quantity: 1 });
  const response = await api.post("/api/v1/orders", { data: CHECKOUT });
  expect(response.status(), "POST /api/v1/orders").toBe(201);
  const body = (await response.json()) as { data: { id: string } };
  return body.data.id;
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
  placeOrdersAsFreshShopper: async ({ playwright, baseURL }, use) => {
    await use(async (count) => {
      const api = await playwright.request.newContext({
        baseURL,
        storageState: { cookies: [], origins: [] },
      });
      try {
        const shopper = freshShopper();
        await signUp(api, shopper);
        const [product] = await seededProducts(api);
        const orderIds: string[] = [];
        for (let placed = 0; placed < count; placed++) {
          orderIds.push(await placeOrder(api, product));
        }
        return { shopper, orderIds };
      } finally {
        await api.dispose();
      }
    });
  },

  placeOrderAsFreshShopper: async ({ placeOrdersAsFreshShopper }, use) => {
    await use(async () => {
      const {
        shopper,
        orderIds: [orderId],
      } = await placeOrdersAsFreshShopper(1);
      return { shopper, orderId };
    });
  },

  placeOrder: async ({ context }, use) => {
    await use((product) => placeOrder(context.request, product));
  },

  listOrders: async ({ context }, use) => {
    await use(() =>
      readData<ShopperOrder[]>(context.request, "/api/v1/orders"),
    );
  },

  // The server runs under NODE_ENV=test, so nothing leaves the process: the
  // test-only route is the only way a spec sees what checkout sent. Filtered
  // by recipient because every shopper here has an email of its own.
  outbox: async ({ request }, use) => {
    await use((to) =>
      readData<OutboxMessage[]>(
        request,
        `/api/v1/test/outbox?to=${encodeURIComponent(to)}`,
      ),
    );
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
      products: () => seededProducts(request),
      productBySlug: (slug) =>
        readData<CatalogueProduct>(request, `/api/v1/products/slug/${slug}`),
      productsByCategory: (category) =>
        readData<CategoryProduct[]>(
          request,
          `/api/v1/categories/${category}/products`,
        ),
    });
  },

  // The test arrives as the admin (`ADMIN_STORAGE_STATE`), and `context.request`
  // carries that session.
  admin: async ({ context }, use) => {
    const api = context.request;
    await use({
      setOrderStatus: (orderId, status) =>
        writeData(api, "patch", `/api/v1/orders/${orderId}/status`, {
          status,
        }),
      setPaymentStatus: (orderId, paymentStatus) =>
        writeData(api, "patch", `/api/v1/orders/${orderId}/payment-status`, {
          paymentStatus,
        }),
      updateProduct: (productId, changes) =>
        writeData(api, "patch", `/api/v1/products/${productId}`, changes),
      createProduct: (body) => writeData(api, "post", "/api/v1/products", body),
      deleteProduct: (productId) =>
        writeData(api, "delete", `/api/v1/products/${productId}`),
      config: () => readData<HomepageConfig>(api, "/api/v1/config"),
      updateConfig: (configId, slots) =>
        writeData(api, "patch", `/api/v1/config/${configId}`, slots),
      stats: (period) =>
        readData<Stats>(api, `/api/v1/admin/stats?period=${period}`),
    });
  },
});

export { expect };
