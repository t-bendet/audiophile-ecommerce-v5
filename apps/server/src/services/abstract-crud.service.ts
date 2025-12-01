import AppError from "../utils/appError.js";

/**
 * Abstract base class for implementing CRUD (Create, Read, Update, Delete) operations.
 *
 * @template Entity - The database entity type
 * @template CreateInput - The input type for creating new entities
 * @template UpdateInput - The input type for updating existing entities
 * @template DTO - The Data Transfer Object type returned to clients
 * @template Where - The type for database where clauses (default: any)
 * @template Select - The type for database select/projection clauses (default: any)
 * @template ListFilter - The type for filtering list queries (default: unknown)
 *
 * @abstract
 *
 * @description
 * This abstract class provides a standardized interface for CRUD operations across different entities.
 * Subclasses must implement persistence methods and transformation logic.
 *
 * @example
 * ```typescript
 * class UserService extends AbstractCrudService<User, CreateUserInput, UpdateUserInput, UserDTO> {
 *   protected toDTO(entity: User): UserDTO {
 *     return { id: entity.id, name: entity.name };
 *   }
 *
 *   protected buildWhere(filter?: UserFilter) {
 *     return { ...filter };
 *   }
 *
 *   // ... implement other abstract methods
 * }
 * ```
 *
 * @remarks
 * - All persistence methods (persistFindMany, persistFindById, etc.) must be implemented by subclasses
 * - The toDTO method transforms entities to DTOs for client consumption
 * - The buildWhere method constructs database-specific where clauses from filters
 * - List operations support pagination, filtering, ordering, and field selection
 * - All methods throw AppError with appropriate status codes when entities are not found
 */
export abstract class AbstractCrudService<
  Entity,
  CreateInput,
  UpdateInput,
  DTO,
  Where = any,
  Select = any,
  ListFilter = unknown,
> {
  protected abstract toDTO(entity: Entity): DTO;

  // ***** Persistence Layer Methods (to be implemented by subclasses) *****
  // *include filtering, pagination, ordering, selection as needed for list operations*

  protected abstract persistFindMany(params: {
    where: Where;
    skip: number;
    take: number;
    orderBy?: any;
    select?: Select;
  }): Promise<{ data: Entity[]; total: number }>;

  protected abstract persistFindById(id: string): Promise<Entity | null>;
  protected abstract persistCreate(data: CreateInput): Promise<Entity>;
  protected abstract persistUpdate(
    id: string,
    data: UpdateInput
  ): Promise<Entity | null>;
  protected abstract persistDelete(id: string): Promise<boolean>;

  protected abstract buildWhere(filter?: ListFilter): Where;
  protected abstract parseFilter(query: any): ListFilter | undefined;

  protected parseOrderBy(sort?: string): any {
    if (!sort || typeof sort !== "string") {
      return [{ id: "desc" as const }];
    }

    return sort.split(",").map((field: string) => {
      const isDescending = field.startsWith("-");
      const fieldName = isDescending ? field.substring(1) : field;
      return { [fieldName]: isDescending ? "desc" : "asc" };
    });
  }

  protected parseSelect(fields?: string): Select | undefined {
    return undefined; // Override in subclass if select parsing is needed
  }

  // ***** Public CRUD Methods *****

  async list(query: any) {
    const page =
      typeof query?.page !== "undefined" ? Number(query?.page) || 1 : 1;
    const limit =
      typeof query?.limit !== "undefined" ? Number(query?.limit) || 20 : 20;
    const orderBy = this.parseOrderBy(query.sort);
    const select = this.parseSelect(query.fields);
    const filter = this.parseFilter(query);

    const skip = (page - 1) * limit;
    const where = this.buildWhere(filter);

    const { data, total } = await this.persistFindMany({
      where,
      skip,
      take: limit,
      orderBy,
      select,
    });

    return {
      data: select
        ? data // When select is provided, return raw selected fields
        : data.map((e) => this.toDTO(e)), // Otherwise apply DTO transformation
      meta: { page, limit, total },
    };
  }

  async get(id: string) {
    const entity = await this.persistFindById(id);
    if (!entity) throw new AppError("No document found with that ID", 404);
    return this.toDTO(entity);
  }

  async create(input: CreateInput) {
    const entity = await this.persistCreate(input);
    return this.toDTO(entity);
  }

  async update(id: string, input: UpdateInput) {
    const entity = await this.persistUpdate(id, input);
    if (!entity) throw new AppError("No document found with that ID", 404);
    return this.toDTO(entity);
  }

  async delete(id: string) {
    const existed = await this.persistDelete(id);
    if (!existed) throw new AppError("No document found with that ID", 404);
  }

  // ** Helper Methods (optional overrides) **
}
