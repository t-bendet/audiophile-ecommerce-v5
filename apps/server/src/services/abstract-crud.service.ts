import { AppError, ErrorCode, type baseQueryParams } from "@repo/domain";
import { buildMeta, parsePagination, type Pagination } from "../utils/query.js";

/**
 * Simplified abstract base class for CRUD operations.
 *
 * @template Entity - The database entity type
 * @template CreateInput - The input type for creating new entities
 * @template UpdateInput - The input type for updating existing entities
 * @template DTO - The Data Transfer Object type returned to clients
 * @template Query - The validated list query params this service accepts
 *
 * @abstract
 *
 * @description
 * This class provides a standardized interface for CRUD operations.
 * Subclasses implement 6 core persistence methods only - all query building
 * (where, select, orderBy) happens inside persistFindMany, using the shared
 * parsers in `utils/query.ts`.
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
 *   ProductDTO,
 *   ProductQueryParams
 * > {
 *   protected toDTO(entity: Product): ProductDTO {
 *     return { id: entity.id, name: entity.name };
 *   }
 *
 *   // All query logic lives here
 *   protected async persistFindMany(params: Pagination & ProductQueryParams) {
 *     const { skip, take, name, sort, fields } = params;
 *
 *     const where = this.buildProductWhere(name);
 *     const select = parseSelect(fields, PRODUCT_QUERY_FIELDS);
 *     const orderBy = parseOrderBy(sort, PRODUCT_QUERY_FIELDS);
 *
 *     const [data, total] = await prisma.$transaction([
 *       prisma.product.findMany({ where, select, orderBy, skip, take }),
 *       prisma.product.count({ where }),
 *     ]);
 *
 *     return { data, total };
 *   }
 *
 *   // Only the entity-specific where-builder stays private to the service
 *   private buildProductWhere(name?: string) { ... }
 * }
 * ```
 *
 * @remarks
 * - Services implement only what they need
 * - Minimal type complexity: 5 generic params instead of 7
 * - All error handling and pagination handled by base class
 * - Optional filterUpdateInput hook for input validation
 */
export abstract class AbstractCrudService<
  Entity,
  CreateInput,
  UpdateInput,
  DTO,
  Query extends baseQueryParams = baseQueryParams,
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
  protected abstract persistFindMany(
    params: Pagination & Query,
  ): Promise<{ data: Entity[]; total: number }>;

  protected abstract persistFindById(id: string): Promise<Entity | null>;
  protected abstract persistCreate(data: CreateInput): Promise<Entity>;
  protected abstract persistUpdate(
    id: string,
    data: UpdateInput,
  ): Promise<Entity | null>;
  protected abstract persistDelete(id: string): Promise<boolean>;

  // ***** Public CRUD Methods *****

  async getAll(query: Query) {
    const pagination = parsePagination(query);

    const { data, total } = await this.persistFindMany({
      ...query,
      ...pagination,
    });

    return {
      data: data.map((e) => this.toDTO(e)),
      meta: buildMeta({ ...pagination, total }),
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
   * Override to whitelist the fields the entity accepts on update.
   */
  protected filterUpdateInput?(input: UpdateInput): UpdateInput;

  // ** Helper Methods **

  protected pickFieldsByAllowed<T extends Record<string, unknown>>(
    obj: T,
    fields: (keyof T)[],
  ): Partial<T> {
    return fields.reduce((acc, field) => {
      if (field in obj) {
        acc[field] = obj[field];
      }
      return acc;
    }, {} as Partial<T>);
  }
}
