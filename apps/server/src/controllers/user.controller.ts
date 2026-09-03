import {
  createEmptyResponse,
  createListResponse,
  createSingleItemResponse,
  UserCreateRequestSchema,
  UserDeleteByIdRequestSchema,
  UserDeleteMeRequestSchema,
  UserGetAllRequestSchema,
  UserGetByIdRequestSchema,
  UserGetMeRequestSchema,
  UserUpdateByIdRequestSchema,
  UserUpdateMeRequestSchema,
} from "@repo/domain";
import { userService } from "../services/user.service.js";
import { defineHandler, ValidatedHandler } from "../utils/define-handler.js";

// Get the authenticated user's own record
export const getMe: ValidatedHandler = defineHandler(
  UserGetMeRequestSchema,
  async (req, res, _next) => {
    const dto = await userService.get(req.user!.id);
    res.status(200).json(createSingleItemResponse(dto));
  },
);

// Get a single user
export const getUser: ValidatedHandler = defineHandler(
  UserGetByIdRequestSchema,
  async (req, res, _next) => {
    const dto = await userService.get(req.verified.params.id);
    res.status(200).json(createSingleItemResponse(dto));
  },
);

export const deleteMe: ValidatedHandler = defineHandler(
  UserDeleteMeRequestSchema,
  async (req, res, _next) => {
    await userService.deactivate(req.user!.id);
    res.status(200).json(createEmptyResponse());
  },
);

// Get all Users
export const getAllUsers: ValidatedHandler = defineHandler(
  UserGetAllRequestSchema,
  async (req, res, _next) => {
    const result = await userService.getAll(req.verified.query);
    res.status(200).json(createListResponse(result.data, result.meta));
  },
);

// deleting a user
export const deleteUser: ValidatedHandler = defineHandler(
  UserDeleteByIdRequestSchema,
  async (req, res, _next) => {
    await userService.delete(req.verified.params.id);
    res.status(200).json(createEmptyResponse());
  },
);

// updating a single user
export const updateUser: ValidatedHandler = defineHandler(
  UserUpdateByIdRequestSchema,
  async (req, res, _next) => {
    const dto = await userService.updateAsAdmin(
      req.verified.params.id,
      req.verified.body,
    );
    res.status(200).json(createSingleItemResponse(dto));
  },
);

export const updateMe: ValidatedHandler = defineHandler(
  UserUpdateMeRequestSchema,
  async (req, res, _next) => {
    const dto = await userService.update(req.user!.id, req.verified.body);
    res.status(200).json(createSingleItemResponse(dto));
  },
);

export const createUser: ValidatedHandler = defineHandler(
  UserCreateRequestSchema,
  async (req, res, _next) => {
    const dto = await userService.create(req.verified.body);
    res.status(201).json(createSingleItemResponse(dto));
  },
);
