import {
  createEmptyResponse,
  createListResponse,
  createSingleItemResponse,
} from "@repo/domain";
import { RequestHandler } from "express";
import { categoryService } from "../services/category.service.js";
import catchAsync from "../utils/catchAsync.js";

export const getAllCategories: RequestHandler = catchAsync(async (req, res) => {
  const result = await categoryService.getAll(req.verified?.query);
  res.status(200).json(createListResponse(result.data, result.meta));
});

export const getCategoryById: RequestHandler = catchAsync(async (req, res) => {
  const dto = await categoryService.get(req.verified?.params.id);
  res.status(200).json(createSingleItemResponse(dto));
});

// * ADMIN CONTROLLERS

export const createCategory: RequestHandler = catchAsync(async (req, res) => {
  const dto = await categoryService.create(req.verified?.body);
  res.status(201).json(createSingleItemResponse(dto));
});

export const updateCategory: RequestHandler = catchAsync(async (req, res) => {
  const dto = await categoryService.update(
    req.verified?.params.id,
    req.verified?.body
  );
  res.status(200).json(createSingleItemResponse(dto));
});

export const deleteCategory: RequestHandler = catchAsync(async (req, res) => {
  await categoryService.delete(req.verified?.params.id);
  res.status(200).json(createEmptyResponse());
});
