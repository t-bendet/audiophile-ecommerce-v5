import {
  ConfigCreateRequestSchema,
  ConfigDeleteByIdRequestSchema,
  ConfigGetUniqueRequestSchema,
  ConfigUpdateByIdRequestSchema,
  createEmptyResponse,
  createSingleItemResponse,
} from "@repo/domain";
import { configService } from "../services/config.service.js";
import { defineHandler, ValidatedHandler } from "../utils/define-handler.js";

export const getConfig: ValidatedHandler = defineHandler(
  ConfigGetUniqueRequestSchema,
  async (_req, res) => {
    const result = await configService.getUniqueConfig();
    res.status(200).json(createSingleItemResponse(result));
  },
);

// * ADMIN CONTROLLERS

export const createConfig: ValidatedHandler = defineHandler(
  ConfigCreateRequestSchema,
  async (req, res) => {
    const dto = await configService.create(req.verified.body);
    res.status(201).json(createSingleItemResponse(dto));
  },
);

export const updateConfig: ValidatedHandler = defineHandler(
  ConfigUpdateByIdRequestSchema,
  async (req, res) => {
    const dto = await configService.update(
      req.verified.params.id,
      req.verified.body,
    );
    res.status(200).json(createSingleItemResponse(dto));
  },
);

export const deleteConfig: ValidatedHandler = defineHandler(
  ConfigDeleteByIdRequestSchema,
  async (req, res) => {
    await configService.delete(req.verified.params.id);
    res.status(200).json(createEmptyResponse());
  },
);
