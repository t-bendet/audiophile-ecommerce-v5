import { prisma } from "@repo/database";
import { UserPublicInfo } from "@repo/domain";
import { Request, RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import { env } from "../utils/env.js";

const signToken = (id: string) => {
  return jwt.sign({ id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

export const createAndSendToken = (
  user: UserPublicInfo,
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

export const signup: RequestHandler = catchAsync(async (req, res, next) => {
  const newUser = await prisma.user.create({
    data: {
      ...req.body,
    },
  });

  createAndSendToken(newUser, 201, req, res);
});

export const login: RequestHandler = catchAsync(async (req, res, next) => {
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
});

export const logout = (_req: Request, res: Response) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ statusText: "success", date: null });
};

export const updatePassword: RequestHandler = catchAsync(
  async (req, res, next) => {
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
  }
);
