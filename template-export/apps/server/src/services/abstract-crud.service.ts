import { AppError, ErrorCode, Meta } from "@repo/domain";

/**
 * Simplified abstract base class for CRUD operations.
 *
 * @template Entity - The database entity type
 * @template CreateInput - The input type for creating new entities
 * @template UpdateInput - The input type for updating existing entities
 * @template DTO - The Data Transfer Object type returned to clients
 *
 * @abstract
 *
 * @description
 * This class provides a standardized interface for CRUD operations.
 * Subclasses implement 6 core persistence methods only - all query building
 * (where, select, orderBy) happens inside persistFindMany.
 *
 * Benefits:
 * - Clear data flow: getAll() -> persistFindMany() -> toDTO()
 * - All query logic in one place (easier to trace and debug)
 * - Flexible: each service implements queries however it needs
 * - Less ceremony: no abstract buildWhere(), parseFilter(), etc.
 *
 * @example
 * ```typescript
 * class ProductService extends AbstractCrudService<
 *   Product,
 *   ProductCreateInput,
 *   ProductUpdateInput,
 *   ProductDTO
 * > {
 *   protected toDTO(entity: Product): ProductDTO {
 *     return { id: entity.id, name: entity.name };
 *   }
 *
 *   // All query logic lives here
 *   protected async persistFindMany(params) {
 *     const { page = 1, limit = 20, filters, sort, fields } = params;
 *
 *     // Build where, select, orderBy locally
 *     const where = this.buildProductWhere(filters);
 *     const select = this.parseProductSelect(fields);
 *     const orderBy = this.parseProductOrderBy(sort);
 *
 *     const skip = (page - 1) * limit;
 *     const [data, total] = await prisma.$transaction([
 *       prisma.product.findMany({ where, select, orderBy, skip, take: limit }),
 *       prisma.product.count({ where }),
 *     ]);
 *
 *     return { data, total };
 *   }
 *
 *   // Private helpers
 *   private buildProductWhere(filters?: any) { ... }
 *   private parseProductSelect(fields?: string) { ... }
 *   private parseProductOrderBy(sort?: string) { ... }
 * }
 * ```
 *
 * @remarks
 * - Services implement only what they need
 * - Minimal type complexity: 4 generic params instead of 7
 * - All error handling and pagination handled by base class
 * - Optional filterUpdateInput hook for input validation
 */
export abstract class AbstractCrudService<
  Entity,
  CreateInput,
  UpdateInput,
  DTO,
> {
  /**
   * Transform entity to DTO for client response
   */
  protected abstract toDTO(entity: Entity): DTO;

  /**
   * Query entities with pagination, filtering, ordering, and field selection.
   * Implement all query building logic here.
   *
   * @param params - Query parameters including page, limit, filters, sort, fields
   * @returns Array of entities and total count
   */
  protected abstract persistFindMany(params: {
    page?: number;
    limit?: number;
    [key: string]: any; // Allow services to pass any custom query params
  }): Promise<{ data: Entity[]; total: number }>;

  protected abstract persistFindById(id: string): Promise<Entity | null>;
  protected abstract persistCreate(data: CreateInput): Promise<Entity>;
  protected abstract persistUpdate(
    id: string,
    data: UpdateInput
  ): Promise<Entity | null>;
  protected abstract persistDelete(id: string): Promise<boolean>;

  // ***** Public CRUD Methods *****

  async getAll(query: any) {
    const page =
      typeof query?.page !== "undefined" ? Number(query?.page) || 1 : 1;
    const limit =
      typeof query?.limit !== "undefined" ? Number(query?.limit) || 20 : 20;

    // Pass all query params to persistFindMany - service decides what to do with them
    const { data, total } = await this.persistFindMany({
      page,
      limit,
      ...query, // filters, sort, fields, etc.
    });

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      data: data.map((e) => this.toDTO(e)),
      meta: { page, limit, total, totalPages, hasNext, hasPrev } satisfies Meta,
    };
  }

  async get(id: string) {
    const entity = await this.persistFindById(id);
    if (!entity)
      throw new AppError("No document found with that ID", ErrorCode.NOT_FOUND);
    return this.toDTO(entity);
  }

  async create(input: CreateInput) {
    const entity = await this.persistCreate(input);
    return this.toDTO(entity);
  }

  async update(id: string, input: UpdateInput) {
    const validatedInput = this.filterUpdateInput
      ? this.filterUpdateInput(input)
      : input;

    const entity = await this.persistUpdate(id, validatedInput);
    if (!entity)
      throw new AppError("No document found with that ID", ErrorCode.NOT_FOUND);
    return this.toDTO(entity);
  }

  async delete(id: string) {
    const existed = await this.persistDelete(id);
    if (!existed)
      throw new AppError("No document found with that ID", ErrorCode.NOT_FOUND);
  }

  // ** Optional Hooks **

  /**
   * Optional: Filter/validate update input before persistence.
   * Override to whitelist or blacklist fields.
   */
  protected filterUpdateInput?(input: UpdateInput): UpdateInput;

  // ** Helper Methods **

  protected pickFieldsByAllowed<T extends Record<string, any>>(
    obj: T,
    fields: (keyof T)[]
  ): Partial<T> {
    return fields.reduce((acc, field) => {
      if (field in obj) {
        acc[field] = obj[field];
      }
      return acc;
    }, {} as Partial<T>);
  }

  protected pickFieldsByNotAllowed<T extends Record<string, any>>(
    obj: T,
    fields: (keyof T)[]
  ): Partial<T> {
    const result: Partial<T> = {};
    for (const key in obj) {
      if (!fields.includes(key as keyof T)) {
        result[key] = obj[key];
      }
    }
    return result;
  }
}
