import { prisma } from "@repo/database";
import { RequestHandler } from "express";
import catchAsync from "../utils/catchAsync.js";

export const createConfig: RequestHandler = catchAsync(async (req, res) => {
  const { name, featuredProduct, showCaseProducts } = req.body;

  const config = await prisma.config.create({
    data: {
      name,
      featuredProduct,
      showCaseProducts,
    },
  });

  res.status(201).json({
    status: "success",
    data: config,
  });
});

export const getConfig: RequestHandler = catchAsync(async (req, res) => {
  const config = await prisma.config.findFirstOrThrow();

  res.status(201).json({
    status: "success",
    data: config,
  });
});
