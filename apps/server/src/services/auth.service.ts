import { prisma } from "@repo/database";
import {
  AuthLoginUser,
  AuthSignUpUser,
  ErrorCode,
  UserPublicInfo,
} from "@repo/domain";
import jwt from "jsonwebtoken";
import AppError from "../utils/appError.js";
import { env } from "../utils/env.js";

/**
 * AuthService handles all authentication business logic
 * Responsibilities:
 * - User registration/signup
 * - User authentication/login
 * - Password validation
 * - Token generation
 * - Password updates
 * - Token verification
 *
 * Does NOT handle:
 * - HTTP responses
 * - Cookie management or HTTP configurations
 * - Request/Response objects
 */
export class AuthService {
  /**
   * Sign a JWT token for a user
   */
  private signToken(id: string): string {
    return jwt.sign({ id }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });
  }

  /**
   * Register a new user
   * @param data - User registration data
   * @returns The created user
   */
  async signup(data: AuthSignUpUser): Promise<UserPublicInfo> {
    // Create user with Prisma (password hashing happens via schema defaults)
    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        passwordConfirm: data.passwordConfirm,
        name: data.name,
      },
    });

    return newUser as UserPublicInfo;
  }

  /**
   * Authenticate a user and return their data
   * @param email - User email
   * @param password - User password (plain text)
   * @returns User data without password
   */
  async login({
    email,
    password,
  }: AuthLoginUser): Promise<UserPublicInfo & { token: string }> {
    // Find user with password field
    const user = await prisma.user.findUniqueOrThrow({
      where: { email },
      omit: {
        password: false,
      },
    });

    // Validate password using Prisma's custom method
    const isPasswordValid = await prisma.user.validatePassword(
      password,
      user.password
    );

    if (!isPasswordValid) {
      throw new AppError(
        "Incorrect email or password",
        ErrorCode.INVALID_CREDENTIALS
      );
    }

    // Generate token
    const token = this.signToken(user.id);

    // Remove password from returned user object
    const { password: _, ...userWithoutPassword } = user;

    return {
      ...userWithoutPassword,
      token,
    } as UserPublicInfo & { token: string };
  }

  /**
   * Update user password
   * @param userId - ID of user updating password
   * @param currentPassword - User's current password
   * @param newPassword - New password
   * @returns User data and new token
   */
  async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<UserPublicInfo & { token: string }> {
    // Get user with password field
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      omit: {
        password: false,
      },
    });

    // Validate current password
    const isPasswordValid = await prisma.user.validatePassword(
      currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      throw new AppError(
        "Your current password is wrong.",
        ErrorCode.INVALID_CREDENTIALS
      );
    }

    // Update password
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        password: newPassword,
        passwordConfirm: newPassword,
      },
    });

    // Generate new token
    const token = this.signToken(updatedUser.id);

    return {
      ...updatedUser,
      token,
    } as UserPublicInfo & { token: string };
  }

  /**
   * Verify and decode a JWT token
   * @param token - JWT token string
   * @returns Decoded token payload
   */
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, env.JWT_SECRET);
    } catch (error) {
      throw new AppError(
        "Invalid or expired token",
        ErrorCode.INVALID_CREDENTIALS
      );
    }
  }
}

export const authService = new AuthService();
