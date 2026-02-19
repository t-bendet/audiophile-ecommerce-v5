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
import { getTokenFromRequest } from "../middlewares/auth.middleware.js";

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
  res: Response,
) => {
  const isProduction = env.NODE_ENV === "production";
  const isSecure = req.secure || req.headers["x-forwarded-proto"] === "https";

  const cookieOptions: {
    expires: Date;
    httpOnly: boolean;
    secure: boolean;
    sameSite: "strict" | "lax" | "none";
  } = {
    expires: new Date(
      Date.now() + Number(env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    secure: isSecure,
    // Cross-origin cookies require sameSite: 'none' and secure: true
    // In development, use 'lax' to avoid issues with localhost
    sameSite: isProduction ? "none" : "lax",
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
  const isProduction = env.NODE_ENV === "production";
  const isSecure = req.secure || req.headers["x-forwarded-proto"] === "https";

  res.clearCookie("jwt", {
    httpOnly: true,
    secure: isSecure,
    sameSite: isProduction ? "none" : "lax",
  });
  res.status(200).json(createEmptyResponse());
};

/**
 * Update user password
 * Gets user ID from request(after authentication), delegates to service, sends response with new token
 */
export const updatePassword: RequestHandler = catchAsync(
  async (req, res, next) => {
    // passwordConfirm and currentPassword validation handled in zod schema
    const { currentPassword, password } = req.verified?.body;
    const userId = req.user?.id!;

    if (!userId) {
      return next(
        new AppError("User ID not found in request", ErrorCode.UNAUTHORIZED),
      );
    }

    const userData = await authService.updatePassword(
      userId,
      currentPassword,
      password,
    );
    const { token, user } = userData;
    createAndSendAuthCookie(user, token, 200, req, res);
  },
);

export const getUserAuthStatus: RequestHandler = catchAsync(
  async (req, res, _next) => {
    // 1) Get token from request
    const token = getTokenFromRequest(req);
    // 2) checkAuthStatus in authService
    const user = await authService.checkIsAuthenticated(token);

    res.status(200).json(createSingleItemResponse({ isAuthenticated: user }));
  },
);
