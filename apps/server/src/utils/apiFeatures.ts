import { Request } from "express";

// TODO delete after product and user controllers refactor --- IGNORE ---
function hasStringKeys<T extends string>(
  value: unknown,
  ...keys: T[]
): value is Record<T, string> {
  if (typeof value !== "object" || value === null) return false;
  return keys.every(
    (key) =>
      key in value &&
      typeof (value as Record<string, unknown>)[key] === "string"
  );
}

type QueryString = Request["query"];

type Query = {
  where?: {
    [key: string]: string | QueryString | (string | QueryString)[] | undefined;
  };
  orderBy?: Array<{ [key: string]: "asc" | "desc" }>;
  take?: number;
  skip?: number;
  select?: {
    [key: string]: boolean | undefined;
  }; // Prisma select fields
  include?: {
    [key: string]: boolean | undefined;
  }; // Prisma include fields
};

class PrismaAPIFeatures {
  private query;
  private queryString;

  constructor(queryString: QueryString, query: Query = {}) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "fields", "include"];
    excludedFields.forEach((el) => delete queryObj[el]);
    this.query = { ...this.query, where: queryObj };
    return this;
  }

  sort() {
    if (hasStringKeys(this.queryString, "sort")) {
      const sortBy = this.queryString.sort.split(",").map((field: string) => {
        const isDescending = field.startsWith("-");
        return {
          [isDescending ? field.substring(1) : field]: isDescending
            ? "desc"
            : "asc",
        };
      }) as { [key: string]: "asc" | "desc" }[];
      this.query = { ...this.query, orderBy: sortBy };
    } else {
      this.query = { ...this.query, orderBy: [{ id: "desc" as const }] };
    }

    return this;
  }

  limitFields() {
    if (hasStringKeys(this.queryString, "fields")) {
      const fields = this.queryString.fields
        .split(",")
        .filter((field: string) => field.trim() !== "");
      this.query = {
        ...this.query,
        select: fields.reduce(
          (acc: any, field: string) => ({ ...acc, [field]: true }),
          {}
        ),
      };
    }
    return this;
  }

  include() {
    if (hasStringKeys(this.queryString, "include")) {
      const fields = this.queryString.include
        .split(",")
        .filter((field: string) => field.trim() !== "");
      this.query = {
        ...this.query,
        include: fields.reduce(
          (acc: any, field: string) => ({ ...acc, [field]: true }),
          {}
        ),
      };
    }
    return this;
  }

  paginate() {
    let page = 1;
    let limit = 100;
    if (hasStringKeys(this.queryString, "page")) {
      page = parseInt(this.queryString.page, 10);
    }
    if (hasStringKeys(this.queryString, "limit")) {
      page = parseInt(this.queryString.limit, 10);
    }
    const skip = (page - 1) * limit;
    this.query = { ...this.query, skip, take: limit };
    return this;
  }

  getQuery() {
    return this.query;
  }
}

export default PrismaAPIFeatures;
