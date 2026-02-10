import { AppError, ErrorCode, UserPublicInfo } from "@repo/domain";
import { NextFunction, Request, RequestHandler, Response } from "express";
import { authService } from "../services/auth.service.js";
import catchAsync from "../utils/catchAsync.js";

export const getTokenFromRequest = (req: Request): string | null => {
  const { authorization, cookie } = req.headers;
  let token: string | null = null;
  if (authorization?.startsWith("Bearer")) {
    token = authorization.replace("Bearer ", "");
  } else if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  } else if (cookie) {
    const cookies = Object.fromEntries(
      cookie.split("; ").map((c) => {
        const [key, value] = c.split("=");
        return [key, value];
      }),
    );
    token = cookies["jwt"];
  }
  return token;
};

/**
 * Middleware to authenticate users via JWT token.
 * Checks for token in Authorization header (Bearer) or cookies.
 * Validates token, checks if user exists, and verifies password hasn't changed since token issuance.
 * Attaches user to req.user on success.
 */
export const authenticate: RequestHandler = catchAsync(
  async (req, _res, next) => {
    // * 1) Getting token and check if it's there
    const token = getTokenFromRequest(req);

    const currentUser = await authService.validateTokenAndGetUser(token);

    req.user = currentUser;

    return next();
  },
);

/**
 * Middleware factory to authorize users based on roles.
 * Must be used after authenticate middleware.
 *
 * @param roles - Allowed roles for the route
 * @returns Middleware that checks if req.user.role matches any of the allowed roles
 *
 * @example
 * router.delete('/admin-only', authenticate, authorize('ADMIN'), handler);
 */
export const authorize = (...roles: UserPublicInfo["role"][]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        new AppError(
          "Authentication required before authorization",
          ErrorCode.UNAUTHORIZED,
        ),
      );
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          "You do not have permission to perform this action",
          ErrorCode.FORBIDDEN,
        ),
      );
    }

    next();
  };
};
