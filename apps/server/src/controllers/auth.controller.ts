import { prisma } from "@repo/database";
import { NextFunction, Request, Response, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import * as userSchema from "../schemas/user.schema.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import { env } from "../utils/env.js";

const signToken = (id: string) => {
  return jwt.sign({ id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

export const createAndSendToken = (
  user: userSchema.UserPublicInfo,
  statusCode: number,
  req: Request,
  res: Response
) => {
  const token = signToken(user.id);
  const cookieOptions = {
    expires: new Date(
      //* milliseconds (*1000)=> seconds (*60)=>
      //* minuets (*60)=> hours (*24)=> days
      //* JWT_COOKIE_EXPIRES_IN: days
      Date.now() + Number(env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000
      // Date.now() + ms(val) can also work
    ),
    //* cookie will only be sent on encrypted connection(https)
    //* true only if we are on production mode
    // secure: env.NODE_ENV === "production",
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
    //* cookie can not be accessed or modified by the browser
    httpOnly: true,
  };

  res.cookie("jwt", token, cookieOptions);

  res.status(statusCode).json({
    statusText: "success",
    data: {
      user,
      token,
    },
  });
};

export const signup: RequestHandler<{}, any, userSchema.CreateInput> =
  catchAsync(async (req, res, next) => {
    const newUser = await prisma.user.create({
      data: {
        ...req.body,
      },
    });

    createAndSendToken(newUser, 201, req, res);
  });

export const login: RequestHandler<{}, any, userSchema.ReadInput> = catchAsync(
  async (req, res, next) => {
    const { email, password } = req.body;
    // * 2) Check if user exists && password is correct
    const user = await prisma.user.findUniqueOrThrow({
      where: { email },
      omit: {
        password: false,
      },
    });

    if (!(await prisma.user.validatePassword(password, user.password))) {
      return next(new AppError("Incorrect email or password", 401));
    }

    const { password: _, ...userWithoutPassword } = user;
    // * 3) Return new token to client
    createAndSendToken(userWithoutPassword, 200, req, res);
  }
);

export const logout = (_req: Request, res: Response) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ statusText: "success", date: null });
};

export const authenticate: RequestHandler = catchAsync(
  async (req, _res, next) => {
    // * 1) Getting token and check if it's there
    const { authorization } = req.headers;
    let token;
    if (authorization?.startsWith("Bearer")) {
      token = authorization.replace("Bearer ", "");
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }
    if (!token) {
      return next(
        new AppError("You ar not logged in! Please log in to again access", 401)
      );
    }

    //* 2) Validate Token
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (!decoded || typeof decoded === "string") {
      return next(new AppError("Invalid token", 401));
    }
    // //* 3) check if user still exists
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.id },
    });
    if (!currentUser) {
      return next(
        new AppError(
          "The user belonging to this token does no longer exists",
          401
        )
      );
    }
    // //* 4) check if user changed password after the token was issued
    const hasPasswordChanged = await prisma.user.isPasswordChangedAfter(
      decoded.iat!,
      currentUser.passwordChangedAt
    );
    if (hasPasswordChanged) {
      return next(
        new AppError(
          "User recently changed password! Please log in to again",
          401
        )
      );
    }

    req.user = currentUser;

    return next();
  }
);

export const checkAuthorization = (
  ...roles: userSchema.UserPublicInfo["role"][]
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user!.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }

    next();
  };
};

export const updatePassword: RequestHandler<
  {},
  any,
  userSchema.UpdatePasswordInput
> = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const { currentPassword, password, passwordConfirm } = req.body;
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.user?.id },
    omit: {
      password: false,
    },
  });

  // 2) Check if POSTed current password is correct
  if (!(await prisma.user.validatePassword(currentPassword, user.password))) {
    return next(new AppError("Your current password is wrong.", 401));
  }

  // 3) If so, update password

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      password: password,
      passwordConfirm: passwordConfirm,
    },
  });
  // 4) Log user in, send JWT
  createAndSendToken(updatedUser, 200, req, res);
});
