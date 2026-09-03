import {
  createEmptyResponse,
  createListResponse,
  createSingleItemResponse,
  ProductCreateRequestSchema,
  ProductDeleteByIdRequestSchema,
  ProductGetAllRequestSchema,
  ProductGetByCategorySchema,
  ProductGetByIdRequestSchema,
  ProductGetByPathSchema,
  ProductGetBySlugSchema,
  ProductGetRelatedByIdRequestSchema,
  ProductUpdateByIdRequestSchema,
} from "@repo/domain";
import { productService } from "../services/product.service.js";
import { defineHandler, ValidatedHandler } from "../utils/define-handler.js";

export const getAllProducts: ValidatedHandler = defineHandler(
  ProductGetAllRequestSchema,
  async (req, res) => {
    const result = await productService.getAll(req.verified.query);
    res.status(200).json(createListResponse(result.data, result.meta));
  },
);

export const getProductById: ValidatedHandler = defineHandler(
  ProductGetByIdRequestSchema,
  async (req, res) => {
    const dto = await productService.get(req.verified.params.id);
    res.status(200).json(createSingleItemResponse(dto));
  },
);

export const getProductBySlug: ValidatedHandler = defineHandler(
  ProductGetBySlugSchema,
  async (req, res) => {
    const dto = await productService.getProductBySlug(req.verified.params.slug);
    res.status(200).json(createSingleItemResponse(dto));
  },
);

export const getRelatedProducts: ValidatedHandler = defineHandler(
  ProductGetRelatedByIdRequestSchema,
  async (req, res) => {
    const result = await productService.getRelatedProducts(
      req.verified.params.id,
    );
    res.status(200).json(createListResponse(result.data, result.meta));
  },
);

export const getProductsByCategoryName: ValidatedHandler = defineHandler(
  ProductGetByCategorySchema,
  async (req, res) => {
    const result = await productService.getProductsByCategoryName(
      req.verified.params.category,
    );
    res.status(200).json(createListResponse(result.data, result.meta));
  },
);

// not exactly SingleItemResponse response but ok for now
export const getShowCaseProducts: ValidatedHandler = defineHandler(
  ProductGetByPathSchema,
  async (_req, res) => {
    const dto = await productService.getShowCaseProducts();
    res.status(200).json(createSingleItemResponse(dto));
  },
);

export const getFeaturedProduct: ValidatedHandler = defineHandler(
  ProductGetByPathSchema,
  async (_req, res) => {
    const dto = await productService.getFeaturedProduct();
    res.status(200).json(createSingleItemResponse(dto));
  },
);

// * ADMIN CONTROLLERS

export const createProduct: ValidatedHandler = defineHandler(
  ProductCreateRequestSchema,
  async (req, res) => {
    const dto = await productService.create(req.verified.body);
    res.status(201).json(createSingleItemResponse(dto));
  },
);

export const updateProduct: ValidatedHandler = defineHandler(
  ProductUpdateByIdRequestSchema,
  async (req, res) => {
    const dto = await productService.update(
      req.verified.params.id,
      req.verified.body,
    );
    res.status(200).json(createSingleItemResponse(dto));
  },
);

export const deleteProduct: ValidatedHandler = defineHandler(
  ProductDeleteByIdRequestSchema,
  async (req, res) => {
    await productService.delete(req.verified.params.id);
    res.status(200).json(createEmptyResponse());
  },
);
