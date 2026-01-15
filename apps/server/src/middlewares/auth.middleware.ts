import { prisma } from "@repo/database";
import { AppError, ErrorCode, UserPublicInfo } from "@repo/domain";
import { NextFunction, Request, RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";
import catchAsync from "../utils/catchAsync.js";
import { env } from "../utils/env.js";

/**
 * Middleware to authenticate users via JWT token.
 * Checks for token in Authorization header (Bearer) or cookies.
 * Validates token, checks if user exists, and verifies password hasn't changed since token issuance.
 * Attaches user to req.user on success.
 */
export const authenticate: RequestHandler = catchAsync(
  async (req, _res, next) => {
    // * 1) Getting token and check if it's there
    const { authorization, cookie } = req.headers;
    let token;
    if (authorization?.startsWith("Bearer")) {
      token = authorization.replace("Bearer ", "");
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    } else if (cookie) {
      const cookies = Object.fromEntries(
        cookie.split("; ").map((c) => {
          const [key, value] = c.split("=");
          return [key, value];
        })
      );
      token = cookies["jwt"];
    }
    if (!token) {
      return next(
        new AppError(
          "You ar not logged in! Please log in to again access",
          ErrorCode.UNAUTHORIZED
        )
      );
    }

    //* 2) Validate Token
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (!decoded || typeof decoded === "string") {
      return next(new AppError("Invalid token", ErrorCode.INVALID_TOKEN));
    }
    // //* 3) check if user still exists
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.id },
    });
    if (!currentUser) {
      return next(
        new AppError(
          "The user belonging to this token does no longer exists",
          ErrorCode.UNAUTHORIZED
        )
      );
    }
    // //* 4) check if user changed password after the token was issued
    if (currentUser.passwordChangedAt) {
      const hasPasswordChanged = await prisma.user.isPasswordChangedAfter(
        decoded.iat!,
        currentUser.passwordChangedAt
      );
      if (hasPasswordChanged) {
        return next(
          new AppError(
            "User recently changed password! Please log in to again",
            ErrorCode.UNAUTHORIZED
          )
        );
      }
    }

    req.user = currentUser;

    return next();
  }
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
          ErrorCode.UNAUTHORIZED
        )
      );
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          "You do not have permission to perform this action",
          ErrorCode.FORBIDDEN
        )
      );
    }

    next();
  };
};
