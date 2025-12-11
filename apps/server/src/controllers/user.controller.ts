import {
  createEmptyResponse,
  createListResponse,
  createSingleItemResponse,
  ErrorCode,
} from "@repo/domain";
import { NextFunction, Request, RequestHandler, Response } from "express";
import { userService } from "../services/user.service.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";

export const getMe = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user || !req.user.id) {
    throw new AppError("User ID not found in request", ErrorCode.UNAUTHORIZED);
  } else {
    req.params.id = req.user?.id!;
    next();
  }
};

// Get a single user
export const getUser: RequestHandler = catchAsync(async (req, res, _next) => {
  const dto = await userService.get(req.verified?.params.id ?? req.params.id);
  res.status(200).json(createSingleItemResponse(dto));
});

export const deleteMe: RequestHandler = catchAsync(async (req, res, _next) => {
  await userService.update(req.user!.id, { active: false });
  res.status(200).json(createEmptyResponse());
});

// Get all Users
export const getAllUsers: RequestHandler = catchAsync(
  async (req, res, _next) => {
    const result = await userService.getAll(req.verified?.query);
    res.status(200).json(createListResponse(result.data, result.meta));
  }
);

// deleting a user
export const deleteUser: RequestHandler = catchAsync(
  async (req, res, _next) => {
    await userService.delete(req.verified?.params.id);
    res.status(200).json(createEmptyResponse());
  }
);

// updating a single user
export const updateUser: RequestHandler = catchAsync(
  async (req, res, _next) => {
    const dto = await userService.update(
      req.verified?.params.id,
      req.verified?.body
    );
    res.status(200).json(createSingleItemResponse(dto));
  }
);

export const updateMe: RequestHandler = catchAsync(async (req, res, _next) => {
  const dto = await userService.update(req.user!.id, req.verified?.body);
  res.status(200).json(createSingleItemResponse(dto));
});

export const createUser: RequestHandler = catchAsync(
  async (req, res, _next) => {
    const dto = await userService.create(req.verified?.body);
    res.status(201).json(createSingleItemResponse(dto));
  }
);
