import { ErrorCode, Meta } from "@repo/domain";
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

  async getAll(query: any) {
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
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;
    return {
      data: select
        ? data // When select is provided, return raw selected fields
        : data.map((e) => this.toDTO(e)), // Otherwise apply DTO transformation
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
    // Optional: Filter input to only allowed fields before update
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

  // ** Helper Methods (optional overrides) **

  /**
   * Optional hook to filter/validate update input before persistence.
   * Override in subclass to whitelist specific fields.
   *
   * **Implement this when:**
   * - User-facing updates with sensitive fields (e.g., role, password, permissions)
   * - Role-based field restrictions (admins can update X, users can only update Y)
   * - Preventing mass-assignment vulnerabilities
   * - Fine-grained control over which fields can be modified
   *
   * **Skip this when:**
   * - Admin-only/internal APIs where all fields are safe to update
   * - Input schema already restricts fields adequately
   * - All entity fields are safe for users to modify
   *
   * @param input - The raw update input from the request
   * @returns Filtered update input with only allowed fields
   *
   * @example
   * ```typescript
   * // User-facing endpoint - only allow safe fields
   * protected filterUpdateInput(input: UserUpdateInput): UserUpdateInput {
   *   const allowedFields: (keyof UserUpdateInput)[] = ['name', 'email', 'avatar'];
   *   return this.pickFields(input, allowedFields);
   * }
   * ```
   * @example
   * ```typescript
   * // User-facing endpoint - disallow unsafe fields
   * protected filterUpdateInput(input: UserUpdateInput): UserUpdateInput {
   *   const disallowedFields: (keyof UserUpdateInput)[] = ['name', 'email', 'avatar'];
   *   return this.pickFieldsNotAllowedToUpdate(input, disallowedFields);
   * }
   * ```
   */

  protected filterUpdateInput?(input: UpdateInput): UpdateInput;

  /**
   * Utility to pick only specified fields from an object
   */
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

  /**
   * Utility to filter out specified fields from an object
   */
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
