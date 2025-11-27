import AppError from "../utils/appError.js";

export abstract class AbstractCrudService<
  Entity,
  CreateInput,
  UpdateInput,
  DTO,
  ListFilter = unknown,
> {
  protected abstract toDTO(entity: Entity): DTO;
  protected abstract buildWhere(filter?: ListFilter): any;

  protected abstract persistFindMany(params: {
    where: any;
    skip: number;
    take: number;
    orderBy?: any;
  }): Promise<{ data: Entity[]; total: number }>;

  protected abstract persistFindById(id: string): Promise<Entity | null>;
  protected abstract persistCreate(data: CreateInput): Promise<Entity>;
  protected abstract persistUpdate(
    id: string,
    data: UpdateInput
  ): Promise<Entity | null>;
  protected abstract persistDelete(id: string): Promise<boolean>;

  async list(params: {
    filter?: ListFilter;
    page?: number;
    limit?: number;
    orderBy?: any;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;
    const where = this.buildWhere(params.filter);
    const { data, total } = await this.persistFindMany({
      where,
      skip,
      take: limit,
      orderBy: params.orderBy,
    });
    return {
      data: data.map((e) => this.toDTO(e)),
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
}
