import { RequestHandler } from "express";
import { categoryService } from "../services/category.service.js";
import catchAsync from "../utils/catchAsync.js";

export const getAllCategories: RequestHandler = catchAsync(async (req, res) => {
  const result = await categoryService.list(req.query);
  res
    .status(200)
    .json({ status: "success", data: result.data, meta: result.meta });
});

export const getCategory: RequestHandler = catchAsync(async (req, res) => {
  const dto = await categoryService.get(req.params.id);
  res.status(200).json({ status: "success", data: dto });
});

export const createCategory: RequestHandler = catchAsync(async (req, res) => {
  const dto = await categoryService.create(req.body);
  res.status(201).json({ status: "success", data: dto });
});

export const updateCategory: RequestHandler = catchAsync(async (req, res) => {
  const dto = await categoryService.update(req.params.id, req.body);
  res.status(200).json({ status: "success", data: dto });
});

export const deleteCategory: RequestHandler = catchAsync(async (req, res) => {
  await categoryService.delete(req.params.id);
  res.status(204).json({ status: "success", data: null });
});
