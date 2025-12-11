import {
  createEmptyResponse,
  createSingleItemResponse,
  UserPublicInfo,
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
const createAndSendToken = (
  user: UserPublicInfo,
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

  res.status(statusCode).json(createSingleItemResponse({ user, token }));
};

/**
 * Sign up a new user
 * Parses request, delegates to service, sends response
 */
export const signup: RequestHandler = catchAsync(async (req, res, next) => {
  const user = await authService.signup(req.body);
  // Generate token after user creation
  const { token } = await authService.login({
    email: user.email,
    password: req.body.password,
  });
  createAndSendToken(user, token, 201, req, res);
});

/**
 * Log in a user
 * Validates credentials via service, sends response with token
 */
export const login: RequestHandler = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const userData = await authService.login({ email, password });
  const { token, ...userWithoutToken } = userData;
  createAndSendToken(userWithoutToken, token, 200, req, res);
});

/**
 * Log out a user
 * Clears JWT cookie
 */
export const logout = (_req: Request, res: Response) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json(createEmptyResponse());
};

/**
 * Update user password
 * Gets user ID from request, delegates to service, sends response with new token
 */
export const updatePassword: RequestHandler = catchAsync(
  async (req, res, next) => {
    const { currentPassword, password } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return next(new Error("User ID not found in request"));
    }

    const userData = await authService.updatePassword(
      userId,
      currentPassword,
      password
    );
    const { token, ...userWithoutToken } = userData;
    createAndSendToken(userWithoutToken, token, 200, req, res);
  }
);
