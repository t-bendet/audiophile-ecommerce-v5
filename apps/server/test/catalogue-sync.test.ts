import { prisma } from "@repo/database";
import { syncCatalogue } from "@repo/database/seed/catalogue-sync";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createUser,
  resetDatabase,
  responsiveImage,
} from "./helpers/database.js";

// `db:sync` writes to production, so what keeps it safe is pinned here: it
// keys on existing unique keys, so nothing it touches changes `_id`, a cart or
// order pointing at a product keeps resolving, and an existing document is
// left alone unless `overwrite` is asked for (ADR 0007).

const catalogueIds = async () => ({
  categories: await prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  }),
  products: await prisma.product.findMany({
    select: { id: true, slug: true },
    orderBy: { slug: "asc" },
  }),
  config: await prisma.config.findFirst({ select: { id: true } }),
});

beforeEach(async () => {
  await resetDatabase();
  await syncCatalogue();
});

describe("syncCatalogue", () => {
  it("writes the whole catalogue onto an empty database", async () => {
    expect(await prisma.category.count()).toBe(3);
    expect(await prisma.product.count()).toBe(6);
    expect(await prisma.config.count()).toBe(1);
  });

  it("changes nothing on a second run", async () => {
    const before = await catalogueIds();

    await syncCatalogue();

    expect(await catalogueIds()).toEqual(before);
    expect(await prisma.product.count()).toBe(6);
  });

  it("keeps a cart and an order resolving their product", async () => {
    const user = await createUser();
    const product = await prisma.product.findFirstOrThrow({
      where: { slug: "zx9-speaker" },
    });
    const cart = await prisma.cart.create({
      data: {
        userId: user.id,
        items: { create: [{ productId: product.id, quantity: 2 }] },
      },
    });
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        subtotal: 4500,
        shippingCost: 50,
        tax: 0,
        total: 4550,
        paymentMethod: "card",
        shippingAddress: {
          fullName: "T",
          email: "t@e.com",
          phone: "1",
          address: "a",
          city: "c",
          state: "s",
          zipCode: "z",
          country: "co",
        },
        billingAddress: {
          fullName: "T",
          address: "a",
          city: "c",
          state: "s",
          zipCode: "z",
          country: "co",
        },
        items: {
          create: [{ productId: product.id, quantity: 1, price: 4500 }],
        },
      },
    });

    await syncCatalogue();

    const storedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { product: true } } },
    });
    const storedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { items: { include: { product: true } } },
    });

    expect(storedCart?.items[0].product.slug).toBe("zx9-speaker");
    expect(storedOrder?.items[0].product.slug).toBe("zx9-speaker");
  });

  it("leaves users alone", async () => {
    await createUser();

    await syncCatalogue();

    expect(await prisma.user.count()).toBe(1);
  });

  // ADR 0007: once published, the database owns the catalogue. An admin's
  // edit survives every deploy's sync; only a hand-run `--overwrite` resets it.
  it("keeps an edited product as it is on a default sync", async () => {
    const before = await prisma.product.findUniqueOrThrow({
      where: { slug: "zx9-speaker" },
    });
    await prisma.product.update({
      where: { slug: "zx9-speaker" },
      data: { price: before.price + 1, name: "ZX9 edited" },
    });

    await syncCatalogue();

    const after = await prisma.product.findUniqueOrThrow({
      where: { slug: "zx9-speaker" },
    });
    expect(after.id).toBe(before.id);
    expect(after.price).toBe(before.price + 1);
    expect(after.name).toBe("ZX9 edited");
  });

  it("creates a product whose slug is missing", async () => {
    // A product no config slot points at, so it can be deleted.
    const removed = await prisma.product.findUniqueOrThrow({
      where: { slug: "xx59-headphones" },
    });
    await prisma.product.delete({ where: { id: removed.id } });

    await syncCatalogue();

    const restored = await prisma.product.findUnique({
      where: { slug: "xx59-headphones" },
    });
    expect(restored).not.toBeNull();
    expect(restored?.id).not.toBe(removed.id);
    expect(await prisma.product.count()).toBe(6);
  });

  it("keeps the config's slot ids on a default sync", async () => {
    const config = await prisma.config.findFirstOrThrow();
    const other = await prisma.product.findUniqueOrThrow({
      where: { slug: "zx7-speaker" },
    });
    await prisma.config.update({
      where: { id: config.id },
      data: { featuredProductId: other.id },
    });

    await syncCatalogue();

    const after = await prisma.config.findUniqueOrThrow({
      where: { id: config.id },
    });
    expect(after.featuredProductId).toBe(other.id);
    expect(await prisma.config.count()).toBe(1);
  });

  it("resets an edit with overwrite, keeping the id", async () => {
    const before = await prisma.product.findUniqueOrThrow({
      where: { slug: "zx9-speaker" },
    });
    await prisma.product.update({
      where: { slug: "zx9-speaker" },
      data: { price: before.price + 1 },
    });
    const beforeCategory = await prisma.category.findUniqueOrThrow({
      where: { name: "Speakers" },
    });
    await prisma.category.update({
      where: { name: "Speakers" },
      data: {
        thumbnail: {
          altText: "drifted",
          image: {
            key: "categories/speakers/thumbnail.png",
            width: 1,
            height: 1,
          },
        },
      },
    });

    await syncCatalogue({ overwrite: true });

    const after = await prisma.product.findUniqueOrThrow({
      where: { slug: "zx9-speaker" },
    });
    expect(after.id).toBe(before.id);
    expect(after.price).toBe(before.price);
    const afterCategory = await prisma.category.findUniqueOrThrow({
      where: { name: "Speakers" },
    });
    expect(afterCategory.id).toBe(beforeCategory.id);
    expect(afterCategory.thumbnail).toEqual(beforeCategory.thumbnail);
  });

  it("keeps a product the repo no longer lists, rather than deleting it", async () => {
    const category = await prisma.category.findFirstOrThrow();
    const retired = await prisma.product.create({
      data: {
        categoryId: category.id,
        name: "retired",
        slug: "retired",
        cartLabel: "retired",
        shortLabel: "retired",
        description: "no longer in the repo",
        price: 1,
        fullLabel: ["retired"],
        featuresText: ["gone"],
        includedItems: [{ item: "Cable", quantity: 1 }],
        images: {
          galleryImages: [],
          introImage: responsiveImage("retired", "intro"),
          primaryImage: responsiveImage("retired", "primary"),
          relatedProductImage: responsiveImage("retired", "related"),
          thumbnail: {
            altText: "a",
            image: {
              key: "products/retired/thumbnail.jpg",
              width: 150,
              height: 150,
            },
          },
        },
      },
    });

    await syncCatalogue();

    expect(
      await prisma.product.findUnique({ where: { id: retired.id } }),
    ).not.toBeNull();
  });
});
