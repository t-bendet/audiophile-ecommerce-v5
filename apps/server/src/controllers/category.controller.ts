import {
  CategoryCreateRequestSchema,
  CategoryDeleteByIdRequestSchema,
  CategoryGetAllRequestSchema,
  CategoryGetByIdRequestSchema,
  CategoryUpdateByIdRequestSchema,
  createEmptyResponse,
  createListResponse,
  createSingleItemResponse,
} from "@repo/domain";
import { categoryService } from "../services/category.service.js";
import { defineHandler, ValidatedHandler } from "../utils/define-handler.js";

export const getAllCategories: ValidatedHandler = defineHandler(
  CategoryGetAllRequestSchema,
  async (req, res) => {
    const result = await categoryService.getAll(req.verified.query);
    res.status(200).json(createListResponse(result.data, result.meta));
  },
);

export const getCategoryById: ValidatedHandler = defineHandler(
  CategoryGetByIdRequestSchema,
  async (req, res) => {
    const dto = await categoryService.get(req.verified.params.id);
    res.status(200).json(createSingleItemResponse(dto));
  },
);

// * ADMIN CONTROLLERS

export const createCategory: ValidatedHandler = defineHandler(
  CategoryCreateRequestSchema,
  async (req, res) => {
    const dto = await categoryService.create(req.verified.body);
    res.status(201).json(createSingleItemResponse(dto));
  },
);

export const updateCategory: ValidatedHandler = defineHandler(
  CategoryUpdateByIdRequestSchema,
  async (req, res) => {
    const dto = await categoryService.update(
      req.verified.params.id,
      req.verified.body,
    );
    res.status(200).json(createSingleItemResponse(dto));
  },
);

export const deleteCategory: ValidatedHandler = defineHandler(
  CategoryDeleteByIdRequestSchema,
  async (req, res) => {
    await categoryService.delete(req.verified.params.id);
    res.status(200).json(createEmptyResponse());
  },
);
