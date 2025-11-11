import { prisma } from "@repo/database";
import { NextFunction, Request, Response, RequestHandler } from "express";
import * as commonSchema from "../schemas/common.schema";
import * as userSchema from "../schemas/user.schema";
import PrismaAPIFeatures from "../utils/apiFeatures";
import catchAsync from "../utils/catchAsync";

export const getMe = (req: Request, _res: Response, next: NextFunction) => {
  req.params.id = req.user?.id!;
  next();
};

// Get a single user
export const getUser: RequestHandler<commonSchema.getByIdParams> = catchAsync(
  async (req, res, _next) => {
    const { id } = req.params;
    const user = await prisma.user.findUniqueOrThrow({
      where: {
        id,
      },
    });

    res.status(200).json({
      status: "success",
      data: user,
    });
  }
);

export const deleteMe: RequestHandler = catchAsync(async (req, res, next) => {
  await prisma.user.update({
    where: {
      id: req.user?.id,
    },
    data: {
      active: false,
    },
  });
  res.status(204).json({
    status: "success",
    data: null,
  });
});

// Get all Users
export const getAllUsers: RequestHandler = catchAsync(
  async (req, res, next) => {
    const query = new PrismaAPIFeatures(req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate()
      .getQuery();
    const users = await prisma.user.findMany(query);

    res.status(200).json({
      status: "success",
      data: users,
    });
  }
);

// deleting a user
export const deleteUser: RequestHandler<commonSchema.getByIdParams> =
  catchAsync(async (req, res, next) => {
    const { id } = req.params;

    await prisma.user.delete({
      where: {
        id,
      },
    });

    res.status(204).json({
      status: "success",
      date: null,
    });
  });

// updating a single user
export const updateUser: RequestHandler<commonSchema.getByIdParams> =
  catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const updatedUser = await prisma.user.update({
      where: {
        id,
      },
      data: req.body,
    });

    res.status(200).json({
      status: "success",
      data: updatedUser,
    });
  });

export const updateMe: RequestHandler<
  {},
  any,
  userSchema.UpdateDetailsInput,
  {},
  { user: userSchema.UserPublicInfo }
> = catchAsync(async (req, res, _next) => {
  const { user } = req;
  const updatedUser = await prisma.user.update({
    where: { id: user?.id },
    data: {
      ...req.body,
    },
  });

  res.status(200).json({
    status: "success",
    data: updatedUser,
  });
});
