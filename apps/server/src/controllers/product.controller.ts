import { prisma } from "@repo/database";
import { Request } from "express";
import * as commonSchema from "../schemas/common.schema";
import * as productSchema from "../schemas/product.schema";
import PrismaAPIFeatures from "../utils/apiFeatures";
import catchAsync from "../utils/catchAsync";

export const getAllProducts = catchAsync(async (req, res) => {
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

export const getProductById = catchAsync<Request<commonSchema.getByIdParams>>(
  async (req, res) => {
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
  }
);

export const getProductBySlug = catchAsync<
  Request<productSchema.ReadBySlugInput>
>(async (req, res) => {
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

export const getRelatedProducts = catchAsync<
  Request<commonSchema.getByIdParams>
>(async (req, res) => {
  const { id } = req.params;

  const relatedProducts = await prisma.product.getRelatedProducts(id);
  res.status(200).json({
    status: "success",
    data: relatedProducts,
  });
});

export const getProductsByCategoryName = catchAsync<
  Request<productSchema.ReadByNameInput>
>(async (req, res) => {
  const products = await prisma.product.getProductsByCategory(
    req.params.category
  );

  res.status(200).json({
    status: "success",
    data: products,
  });
});

export const getShowCaseProducts = catchAsync(async (req, res) => {
  const showCaseProducts = await prisma.product.getShowCaseProducts();
  res.status(200).json({
    status: "success",
    data: showCaseProducts,
  });
});

export const getFeaturedProduct = catchAsync(async (req, res) => {
  const featuredProduct = await prisma.product.getFeaturedProduct();

  res.status(200).json({
    status: "success",
    data: featuredProduct,
  });
});
