import {
  createEmptyResponse,
  createListResponse,
  createSingleItemResponse,
  ProductCreateRequestSchema,
  ProductDeleteByIdRequestSchema,
  ProductGetAllRequestSchema,
  ProductGetByCategorySchema,
  ProductGetByIdRequestSchema,
  ProductGetBySlugSchema,
  ProductGetRelatedByIdRequestSchema,
  ProductUpdateByIdRequestSchema,
} from "@repo/domain";
import { RequestHandler } from "express";
import { productService } from "../services/product.service.js";
import { ValidatedRequest } from "../types/validated-request.js";
import catchAsync from "../utils/catchAsync.js";

export const getAllProducts: RequestHandler = catchAsync<
  ValidatedRequest<typeof ProductGetAllRequestSchema>
>(async (req, res) => {
  const result = await productService.getAll(req.verified.query);
  res.status(200).json(createListResponse(result.data, result.meta));
});

export const getProductById: RequestHandler = catchAsync<
  ValidatedRequest<typeof ProductGetByIdRequestSchema>
>(async (req, res) => {
  const dto = await productService.get(req.verified.params.id);
  res.status(200).json(createSingleItemResponse(dto));
});

export const getProductBySlug: RequestHandler = catchAsync<
  ValidatedRequest<typeof ProductGetBySlugSchema>
>(async (req, res) => {
  const dto = await productService.getProductBySlug(req.verified.params.slug);
  res.status(200).json(createSingleItemResponse(dto));
});

export const getRelatedProducts: RequestHandler = catchAsync<
  ValidatedRequest<typeof ProductGetRelatedByIdRequestSchema>
>(async (req, res) => {
  const result = await productService.getRelatedProducts(req.verified.params.id);
  res.status(200).json(createListResponse(result.data, result.meta));
});

export const getProductsByCategoryName: RequestHandler = catchAsync<
  ValidatedRequest<typeof ProductGetByCategorySchema>
>(async (req, res) => {
  const result = await productService.getProductsByCategoryName(
    req.verified.params.category
  );
  res.status(200).json(createListResponse(result.data, result.meta));
});

// not exactly SingleItemResponse response but ok for now
export const getShowCaseProducts: RequestHandler = catchAsync(
  async (_req, res) => {
    const dto = await productService.getShowCaseProducts();
    res.status(200).json(createSingleItemResponse(dto));
  }
);

export const getFeaturedProduct: RequestHandler = catchAsync(
  async (_req, res) => {
    const dto = await productService.getFeaturedProduct();
    res.status(200).json(createSingleItemResponse(dto));
  }
);

// * ADMIN CONTROLLERS

export const createProduct: RequestHandler = catchAsync<
  ValidatedRequest<typeof ProductCreateRequestSchema>
>(async (req, res) => {
  const dto = await productService.create(req.verified.body);
  res.status(201).json(createSingleItemResponse(dto));
});

export const updateProduct: RequestHandler = catchAsync<
  ValidatedRequest<typeof ProductUpdateByIdRequestSchema>
>(async (req, res) => {
  const dto = await productService.update(
    req.verified.params.id,
    req.verified.body
  );
  res.status(200).json(createSingleItemResponse(dto));
});

export const deleteProduct: RequestHandler = catchAsync<
  ValidatedRequest<typeof ProductDeleteByIdRequestSchema>
>(async (req, res) => {
  await productService.delete(req.verified.params.id);
  res.status(200).json(createEmptyResponse());
});
