import { prisma } from "@repo/database";
import { Request, RequestHandler } from "express";
import * as commonSchema from "../schemas/common.schema.js";
import * as productSchema from "../schemas/product.schema.js";
import PrismaAPIFeatures from "../utils/apiFeatures.js";
import catchAsync from "../utils/catchAsync.js";

export const getAllProducts: RequestHandler = catchAsync(async (req, res) => {
  const query = new PrismaAPIFeatures(req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .getQuery();
  const products = await prisma.product.findMany(query);

  res.status(200).json({
    status: "success",
    data: products,
  });
});

export const getProductById: RequestHandler<commonSchema.GetByIdParams> =
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const product = await prisma.product.findUniqueOrThrow({
      where: {
        id,
      },
    });

    res.status(200).json({
      status: "success",
      data: product,
    });
  });

export const getProductBySlug: RequestHandler<productSchema.ReadProductBySlugParams> =
  catchAsync(async (req, res) => {
    const { slug } = req.params;
    const product = await prisma.product.findUniqueOrThrow({
      where: {
        slug,
      },
    });

    res.status(200).json({
      status: "success",
      data: product,
    });
  });

export const getRelatedProducts: RequestHandler<commonSchema.GetByIdParams> =
  catchAsync(async (req, res) => {
    const { id } = req.params;

    const relatedProducts = await prisma.product.getRelatedProducts(id);
    res.status(200).json({
      status: "success",
      data: relatedProducts,
    });
  });

export const getProductsByCategoryName: RequestHandler<productSchema.ReadProductsByCategoryParams> =
  catchAsync(async (req, res) => {
    const products = await prisma.product.getProductsByCategory(
      req.params.category
    );

    res.status(200).json({
      status: "success",
      data: products,
    });
  });

export const getShowCaseProducts: RequestHandler = catchAsync(
  async (req, res) => {
    const showCaseProducts = await prisma.product.getShowCaseProducts();
    res.status(200).json({
      status: "success",
      data: showCaseProducts,
    });
  }
);

export const getFeaturedProduct: RequestHandler = catchAsync(
  async (req, res) => {
    const featuredProduct = await prisma.product.getFeaturedProduct();

    res.status(200).json({
      status: "success",
      data: featuredProduct,
    });
  }
);
