import { prisma } from "@repo/database";
import {
  AppError,
  ErrorCode,
  type Config,
  type ConfigCreateInput,
  type ConfigDTO,
  type ConfigQueryParams,
  type ConfigSelect,
  type ConfigUpdateInput,
  type ErrorDetail,
} from "@repo/domain";
import { parseOrderBy, parseSelect, type Pagination } from "../utils/query.js";
import { AbstractCrudService } from "./abstract-crud.service.js";

const CONFIG_QUERY_FIELDS = [
  "id",
  "name",
  "createdAt",
  "v",
] as const satisfies readonly (keyof ConfigSelect)[];

const CONFIG_UPDATE_FIELDS = [
  "name",
  "featuredProductId",
  "showCaseCoverId",
  "showCaseWideId",
  "showCaseGridId",
] as const satisfies readonly (keyof ConfigUpdateInput)[];

/** The four product slots the homepage renders, each with the image it needs. */
const CONFIG_SLOTS = [
  "featuredProductId",
  "showCaseCoverId",
  "showCaseWideId",
  "showCaseGridId",
] as const satisfies readonly (keyof Config)[];

type ConfigSlot = (typeof CONFIG_SLOTS)[number];

type SlotIds = Record<ConfigSlot, string>;

const SLOT_IMAGE = {
  featuredProductId: "featuredImage",
  showCaseCoverId: "showCaseImage",
  showCaseWideId: "showCaseImage",
  showCaseGridId: "showCaseImage",
} as const satisfies Record<ConfigSlot, string>;

const slotDetail = (slot: ConfigSlot, message: string): ErrorDetail => ({
  code: "custom",
  message,
  path: ["body", slot],
});

export class ConfigService extends AbstractCrudService<
  Config,
  ConfigCreateInput,
  ConfigUpdateInput,
  ConfigDTO,
  ConfigQueryParams
> {
  protected toDTO(entity: Config): ConfigDTO {
    return entity;
  }

  // ***** Persistence Layer Methods *****

  protected async persistFindMany(
    params: Pagination & ConfigQueryParams,
  ): Promise<{ data: Config[]; total: number }> {
    const { skip, take, sort, fields } = params;

    const where = this.buildConfigWhere();
    const select = parseSelect(fields, CONFIG_QUERY_FIELDS);
    const orderBy = parseOrderBy(sort, CONFIG_QUERY_FIELDS);

    const [data, total] = await prisma.$transaction([
      prisma.config.findMany({
        where,
        skip,
        take,
        orderBy,
        select,
      }),
      prisma.config.count({ where }),
    ]);
    return { data, total };
  }

  protected async persistFindById(id: string) {
    return prisma.config.findUnique({ where: { id } });
  }

  protected async persistCreate(input: ConfigCreateInput) {
    return prisma.config.create({ data: input });
  }

  protected filterUpdateInput(input: ConfigUpdateInput): ConfigUpdateInput {
    return this.pickFieldsByAllowed(input, [...CONFIG_UPDATE_FIELDS]);
  }

  /**
   * The homepage renders the four slots as distinct products, each from the
   * image its slot needs, so a body that would leave the config otherwise is
   * refused with one detail per offending field before anything is written.
   */
  override async update(id: string, input: ConfigUpdateInput) {
    const stored = await this.persistFindById(id);
    if (!stored)
      throw new AppError("No document found with that ID", ErrorCode.NOT_FOUND);

    const sent = CONFIG_SLOTS.filter((slot) => typeof input[slot] === "string");
    const slots = Object.fromEntries(
      CONFIG_SLOTS.map((slot) => [slot, input[slot] ?? stored[slot]]),
    ) as SlotIds;

    const details = [
      ...this.duplicateSlotDetails(slots, sent),
      ...(await this.slotImageDetails(slots, sent)),
    ];
    if (details.length)
      throw new AppError(
        "The homepage slots are not valid",
        ErrorCode.VALIDATION_ERROR,
        undefined,
        details,
      );

    return super.update(id, input);
  }

  // A slot the body sent that shares its product with another slot.
  private duplicateSlotDetails(slots: SlotIds, sent: ConfigSlot[]) {
    return sent
      .filter((slot) =>
        CONFIG_SLOTS.some(
          (other) => other !== slot && slots[other] === slots[slot],
        ),
      )
      .map((slot) =>
        slotDetail(slot, "Each homepage slot needs a different product"),
      );
  }

  // A slot the body sent whose product is missing the image the slot renders.
  private async slotImageDetails(slots: SlotIds, sent: ConfigSlot[]) {
    const products = await prisma.product.findMany({
      where: { id: { in: sent.map((slot) => slots[slot]) } },
      select: { id: true, images: true },
    });
    const byId = new Map(products.map((product) => [product.id, product]));

    return sent.flatMap((slot) => {
      const product = byId.get(slots[slot]);
      if (!product) return [slotDetail(slot, "No product has that id")];
      if (!product.images[SLOT_IMAGE[slot]])
        return [
          slotDetail(
            slot,
            slot === "featuredProductId"
              ? "The featured product needs a featured image"
              : "A showcase product needs a showcase image",
          ),
        ];
      return [];
    });
  }

  protected async persistUpdate(id: string, input: ConfigUpdateInput) {
    return this.nullOnMissingRecord(() =>
      prisma.config.update({ where: { id }, data: input }),
    );
  }

  protected async persistDelete(id: string) {
    return this.falseOnMissingRecord(() =>
      prisma.config.delete({ where: { id } }),
    );
  }

  // ===== Private Query Builders =====

  private buildConfigWhere() {
    // Config typically has no filters (singleton pattern)
    return {};
  }

  async getUniqueConfig(): Promise<ConfigDTO | null> {
    const entity = await prisma.config.findFirst();
    return entity ? this.toDTO(entity) : null;
  }
}

export const configService = new ConfigService();
