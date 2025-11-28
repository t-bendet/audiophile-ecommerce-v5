import type { CategoryCreateInput, CategoryUpdateInput } from "@repo/domain";
import { RequestHandler } from "express";
import { categoryService } from "../services/category.service.js";
import catchAsync from "../utils/catchAsync.js";

// TODO getting only id is not very useful, expand DTO?
// TODO test all controllers

export const getAllCategories: RequestHandler = catchAsync(async (req, res) => {
  const result = await categoryService.listFromQuery(req.query);
  res
    .status(200)
    .json({ status: "success", data: result.data, meta: result.meta });
});

export const getCategory: RequestHandler = catchAsync(async (req, res) => {
  const dto = await categoryService.get(req.params.id);
  res.status(200).json({ status: "success", data: dto });
});

export const createCategory: RequestHandler = catchAsync(async (req, res) => {
  const input = req.body as CategoryCreateInput; // assumes validation middleware ran
  const dto = await categoryService.create(input);
  res.status(201).json({ status: "success", data: dto });
});

export const updateCategory: RequestHandler = catchAsync(async (req, res) => {
  const input = req.body as CategoryUpdateInput; // assumes validation middleware ran
  const dto = await categoryService.update(req.params.id, input);
  res.status(200).json({ status: "success", data: dto });
});

export const deleteCategory: RequestHandler = catchAsync(async (req, res) => {
  await categoryService.delete(req.params.id);
  res.status(204).json({ status: "success", data: null });
});
