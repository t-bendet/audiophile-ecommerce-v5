import { prisma } from "@repo/database";
import PrismaAPIFeatures from "../utils/apiFeatures";
import catchAsync from "../utils/catchAsync";

export const getAllCategories = catchAsync(async (req, res, next) => {
  const query = new PrismaAPIFeatures(req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate()
    .include()
    .getQuery();

  const categories = await prisma.category.findMany(query);

  res.status(200).json({
    status: "success",
    data: categories,
  });
});
