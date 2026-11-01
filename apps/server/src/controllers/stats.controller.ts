import { createSingleItemResponse, GetStatsRequestSchema } from "@repo/domain";
import * as statsService from "../services/stats.service.js";
import { defineHandler, ValidatedHandler } from "../utils/define-handler.js";

/**
 * The shop's numbers over one period (admin only)
 */
export const getStats: ValidatedHandler = defineHandler(
  GetStatsRequestSchema,
  async (req, res) => {
    const dto = await statsService.getStats(req.verified.query.period);
    res.status(200).json(createSingleItemResponse(dto));
  },
);
