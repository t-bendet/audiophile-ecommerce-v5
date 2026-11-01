import {
  statsPeriodStart,
  type StatsDTO,
  type StatsPeriod,
} from "@repo/domain";
import { orderService } from "./order.service.js";
import { userService } from "./user.service.js";

/**
 * The dashboard's landing numbers: the order summary and the new-user count
 * over one period, each computed by its own service.
 */
export const getStats = async (period: StatsPeriod): Promise<StatsDTO> => {
  const since = statsPeriodStart(period);

  const [orders, newUsers] = await Promise.all([
    orderService.summarizeSince(since),
    userService.countCreatedSince(since),
  ]);

  return { period, ...orders, newUsers };
};
