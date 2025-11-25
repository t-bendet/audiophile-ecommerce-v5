import { prisma } from "@repo/database";
import { RequestHandler } from "express";
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

export const getProductById: RequestHandler = catchAsync(async (req, res) => {
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

export const getProductBySlug: RequestHandler = catchAsync(async (req, res) => {
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

export const getRelatedProducts: RequestHandler = catchAsync(
  async (req, res) => {
    const { id } = req.params;

    const relatedProducts = await prisma.product.getRelatedProducts(id);
    res.status(200).json({
      status: "success",
      data: relatedProducts,
    });
  }
);

export const getProductsByCategoryName: RequestHandler = catchAsync(
  async (req, res) => {
    const products = await prisma.product.getProductsByCategory(
      req.params.category
    );

    res.status(200).json({
      status: "success",
      data: products,
    });
  }
);

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
