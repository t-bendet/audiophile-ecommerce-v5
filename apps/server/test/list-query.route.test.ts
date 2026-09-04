import { ErrorCode } from "@repo/domain";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Only Prisma is mocked, so these pin the query the real stack builds.
const findMany = vi.fn(() => []);
const count = vi.fn(() => 0);
const productFindMany = vi.fn(() => []);
const productCount = vi.fn(() => 0);
const userFindMany = vi.fn(() => []);
const userCount = vi.fn(() => 0);

// The users list sits behind authenticate/authorize; the query parsing is what
// is under test, so the chain is stubbed out rather than exercised.
vi.mock("../src/middlewares/auth.middleware.js", () => ({
  authenticate: (req: { user: unknown }, _res: unknown, next: () => void) => {
    req.user = { id: "u1", role: "ADMIN" };
    next();
  },
  authorize: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock("@repo/database", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@repo/database")>()),
  prisma: {
    category: {
      findMany: (args: unknown) => findMany(args),
      count: (args: unknown) => count(args),
    },
    product: {
      findMany: (args: unknown) => productFindMany(args),
      count: (args: unknown) => productCount(args),
    },
    user: {
      findMany: (args: unknown) => userFindMany(args),
      count: (args: unknown) => userCount(args),
    },
    $transaction: (operations: unknown[]) => Promise.all(operations),
  },
}));

const app = (await import("../src/app.js")).default;

const listCategories = async (queryString: string) => {
  const res = await request(app).get(`/api/v1/categories${queryString}`);
  return { res, args: findMany.mock.calls[0]?.[0] as Record<string, unknown> };
};

const listProducts = async (queryString: string) => {
  const res = await request(app).get(`/api/v1/products${queryString}`);
  return {
    res,
    args: productFindMany.mock.calls[0]?.[0] as Record<string, unknown>,
  };
};

const listUsers = async (queryString: string) => {
  const res = await request(app).get(`/api/v1/users${queryString}`);
  return {
    res,
    args: userFindMany.mock.calls[0]?.[0] as Record<string, unknown>,
  };
};

beforeEach(() => {
  findMany.mockClear();
  count.mockClear();
  productFindMany.mockClear();
  productCount.mockClear();
  userFindMany.mockClear();
  userCount.mockClear();
});

describe("GET /api/v1/categories", () => {
  it("rejects an unknown sort field and names it in the error details", async () => {
    const { res } = await listCategories("?sort=hax");

    expect(res.status).toBe(422);
    expect(res.body.error).toMatchObject({
      code: ErrorCode.VALIDATION_ERROR,
      details: [
        {
          code: "unknown_value",
          message: expect.stringContaining('Unknown sort value "hax"'),
          path: ["query", "sort"],
        },
      ],
    });
    expect(findMany).not.toHaveBeenCalled();
  });

  it("keeps a valid sort list, descending fields included", async () => {
    const { args } = await listCategories("?sort=-name,createdAt");

    expect(args.orderBy).toEqual([{ name: "desc" }, { createdAt: "asc" }]);
  });

  it("rejects a mixed sort list rather than dropping its unknown members", async () => {
    const { res } = await listCategories("?sort=hax,-createdAt");

    expect(res.status).toBe(422);
    expect(res.body.error.details).toEqual([
      expect.objectContaining({ path: ["query", "sort"] }),
    ]);
    expect(findMany).not.toHaveBeenCalled();
  });

  it("selects the requested fields when all are whitelisted", async () => {
    const { args } = await listCategories("?fields=id,name");

    expect(args.select).toEqual({ id: true, name: true });
  });

  it("rejects an unknown field and names it in the error details", async () => {
    const { res } = await listCategories("?fields=id,name,password");

    expect(res.status).toBe(422);
    expect(res.body.error).toMatchObject({
      code: ErrorCode.VALIDATION_ERROR,
      details: [
        {
          code: "unknown_value",
          message: expect.stringContaining('Unknown fields value "password"'),
          path: ["query", "fields"],
        },
      ],
    });
    expect(findMany).not.toHaveBeenCalled();
  });

  it("defaults to the first page of 20", async () => {
    const { res, args } = await listCategories("");

    expect(args).toMatchObject({ skip: 0, take: 20, where: {} });
    expect(res.body.meta).toEqual({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    });
  });

  it("translates page and limit into skip and take, and reports them back", async () => {
    count.mockReturnValueOnce(25);
    const { res, args } = await listCategories("?page=2&limit=5");

    expect(args).toMatchObject({ skip: 5, take: 5 });
    expect(res.body.meta).toEqual({
      page: 2,
      limit: 5,
      total: 25,
      totalPages: 5,
      hasNext: true,
      hasPrev: true,
    });
  });

  it("still applies the name filter alongside the parsed query", async () => {
    const { args } = await listCategories("?name=Headphones&sort=name");

    expect(args).toMatchObject({
      where: { name: "Headphones" },
      orderBy: [{ name: "asc" }],
    });
  });

  it("rejects an unknown query key and names it in the error details", async () => {
    const { res } = await listCategories("?name=Headphones&foo=1");

    expect(res.status).toBe(422);
    expect(res.body.error).toMatchObject({
      code: ErrorCode.VALIDATION_ERROR,
      details: [{ code: "unrecognized_keys", path: ["query", "foo"] }],
    });
    expect(findMany).not.toHaveBeenCalled();
  });
});

describe("GET /api/v1/products", () => {
  it("rejects an unknown sort field", async () => {
    const { res } = await listProducts("?sort=hax");

    expect(res.status).toBe(422);
    expect(productFindMany).not.toHaveBeenCalled();
  });

  it("keeps a valid sort list and field selection", async () => {
    const { args } = await listProducts("?sort=-price,name&fields=id,price");

    expect(args).toMatchObject({
      orderBy: [{ price: "desc" }, { name: "asc" }],
      select: { id: true, price: true },
      skip: 0,
      take: 20,
    });
  });

  it("names every unknown sort and field value in one response", async () => {
    const { res } = await listProducts("?sort=hax,-nope&fields=password");

    expect(res.status).toBe(422);
    expect(res.body.error.details).toEqual([
      expect.objectContaining({ path: ["query", "sort"] }),
      expect.objectContaining({ path: ["query", "sort"] }),
      expect.objectContaining({ path: ["query", "fields"] }),
    ]);
    expect(productFindMany).not.toHaveBeenCalled();
  });

  it("accepts the name filter and the pagination keys", async () => {
    const { res } = await listProducts(
      "?name=zx9&fields=id,name&sort=-price&page=2&limit=5",
    );

    expect(res.status).toBe(200);
  });

  it("rejects a product field that is not a supported filter", async () => {
    const { res } = await listProducts("?price=100");

    expect(res.status).toBe(422);
    expect(res.body.error).toMatchObject({
      code: ErrorCode.VALIDATION_ERROR,
      details: [{ code: "unrecognized_keys", path: ["query", "price"] }],
    });
    expect(productFindMany).not.toHaveBeenCalled();
  });

  it("names every unknown query key in the error details", async () => {
    const { res } = await listProducts("?utm_source=newsletter&fbclid=abc");

    expect(res.status).toBe(422);
    expect(res.body.error.details).toEqual([
      expect.objectContaining({ path: ["query", "utm_source"] }),
      expect.objectContaining({ path: ["query", "fbclid"] }),
    ]);
  });
});

describe("GET /api/v1/users", () => {
  it("rejects an unknown sort field", async () => {
    const { res } = await listUsers("?sort=hax");

    expect(res.status).toBe(422);
    expect(userFindMany).not.toHaveBeenCalled();
  });

  it("keeps a valid sort list and field selection", async () => {
    const { args } = await listUsers("?sort=-createdAt,email&fields=id,email");

    expect(args).toMatchObject({
      orderBy: [{ createdAt: "desc" }, { email: "asc" }],
      select: { id: true, email: true },
    });
  });

  it("rejects a field the user list does not expose", async () => {
    const { res } = await listUsers("?fields=id,email,password");

    expect(res.status).toBe(422);
    expect(res.body.error.details).toEqual([
      expect.objectContaining({ path: ["query", "fields"] }),
    ]);
    expect(userFindMany).not.toHaveBeenCalled();
  });

  it("still applies the role filter alongside the parsed query", async () => {
    const { args } = await listUsers("?role=ADMIN&page=3&limit=10");

    expect(args).toMatchObject({
      where: { role: { equals: "ADMIN" } },
      skip: 20,
      take: 10,
    });
  });

  it("rejects an unknown query key and names it in the error details", async () => {
    const { res } = await listUsers("?role=ADMIN&email=a@b.c");

    expect(res.status).toBe(422);
    expect(res.body.error).toMatchObject({
      code: ErrorCode.VALIDATION_ERROR,
      details: [{ code: "unrecognized_keys", path: ["query", "email"] }],
    });
    expect(userFindMany).not.toHaveBeenCalled();
  });
});
