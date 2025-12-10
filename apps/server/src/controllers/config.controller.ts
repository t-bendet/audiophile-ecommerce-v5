import {
  createEmptyResponse,
  createListResponse,
  createSingleItemResponse,
} from "@repo/domain";
import { RequestHandler } from "express";
import { configService } from "../services/config.service.js";
import catchAsync from "../utils/catchAsync.js";

// TODO consider adding config id to env variables for easy access

export const getConfig: RequestHandler = catchAsync(async (req, res) => {
  const result = await configService.getUniqueConfig();
  res.status(200).json(createSingleItemResponse(result));
});

// * ADMIN CONTROLLERS

export const createConfig: RequestHandler = catchAsync(async (req, res) => {
  const dto = await configService.create(req.verified?.body);
  res.status(201).json(createSingleItemResponse(dto));
});

export const updateConfig: RequestHandler = catchAsync(async (req, res) => {
  const dto = await configService.update(
    req.verified?.params.id,
    req.verified?.body
  );
  res.status(200).json(createSingleItemResponse(dto));
});

export const deleteConfig: RequestHandler = catchAsync(async (req, res) => {
  await configService.delete(req.verified?.params.id);
  res.status(200).json(createEmptyResponse());
});
