import {
  AppError,
  createEmptyResponse,
  createSingleItemResponse,
  ErrorCode,
  UserDTO,
} from "@repo/domain";
import { Request, RequestHandler, Response } from "express";
import { authService } from "../services/auth.service.js";
import catchAsync from "../utils/catchAsync.js";
import { env } from "../utils/env.js";

/**
 * Auth Controller handles HTTP layer only
 * Responsibilities:
 * - Request parsing and validation
 * - Response formatting
 * - Cookie and header management
 * - HTTP status codes
 *
 * Business logic is delegated to authService
 */

/**
 * Helper function to create token and send response
 * Handles cookie setting and response formatting
 */
const createAndSendAuthCookie = (
  user: UserDTO,
  token: string,
  statusCode: number,
  req: Request,
  res: Response
) => {
  const cookieOptions = {
    //* milliseconds (*1000)=> seconds (*60)=>
    //* minuets (*60)=> hours (*24)=> days
    //* JWT_COOKIE_EXPIRES_IN: days
    expires: new Date(
      Date.now() + Number(env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000
    ),
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
    httpOnly: true,
  };

  res.cookie("jwt", token, cookieOptions);

  // Token sent via HTTP-only cookie, response contains only user data
  res.status(statusCode).json(createSingleItemResponse(user));
};

/**
 * Sign up a new user
 * Parses request, delegates to service, sends response
 */
export const signup: RequestHandler = catchAsync(async (req, res, next) => {
  const { token, user } = await authService.signup(req.verified?.body);
  createAndSendAuthCookie(user, token, 201, req, res);
});

/**
 * Log in a user
 * Validates credentials via service, sends response with token
 */
export const login: RequestHandler = catchAsync(async (req, res, next) => {
  const { email, password } = req.verified?.body;
  const { user, token } = await authService.login({ email, password });
  createAndSendAuthCookie(user, token, 200, req, res);
});

/**
 * Log out a user
 * Clears JWT cookie
 */
export const logout = (req: Request, res: Response) => {
  // res.cookie("jwt", "loggedout", {
  //   expires: new Date(Date.now() + 10 * 1000),
  //   httpOnly: true,
  // });
  res.clearCookie("jwt", {
    httpOnly: true,
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
  });
  res.status(200).json(createEmptyResponse());
};

/**
 * Update user password
 * Gets user ID from request, delegates to service, sends response with new token
 */
export const updatePassword: RequestHandler = catchAsync(
  async (req, res, next) => {
    // passwordConfirm and currentPassword validation handled in zod schema
    const { currentPassword, password } = req.verified?.body;
    const userId = req.user?.id;

    if (!userId) {
      return next(
        new AppError("User ID not found in request", ErrorCode.UNAUTHORIZED)
      );
    }

    const userData = await authService.updatePassword(
      userId,
      currentPassword,
      password
    );
    const { token, user } = userData;
    createAndSendAuthCookie(user, token, 200, req, res);
  }
);
