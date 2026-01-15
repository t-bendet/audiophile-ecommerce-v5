import { prisma } from "@repo/database";
import {
  AppError,
  AuthLoginRequest,
  AuthSignUpRequest,
  ErrorCode,
  UserDTO,
  UserPublicInfo,
} from "@repo/domain";
import jwt from "jsonwebtoken";
import { env } from "../utils/env.js";

type AuthSessionDTO = {
  user: UserDTO;
  token: string;
};

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
  protected toDTO(entity: UserPublicInfo): UserDTO {
    return {
      id: entity.id,
      name: entity.name,
      email: entity.email,
      role: entity.role,
      emailVerified: entity.emailVerified,
      createdAt: entity.createdAt,
      v: entity.v,
    } satisfies UserDTO;
  }
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
   * @returns The created user with token
   */
  async signup(
    data: AuthSignUpRequest
  ): Promise<{ user: UserDTO; token: string }> {
    // Create user with Prisma (password hashing happens via schema defaults)
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        passwordConfirm: data.passwordConfirm,
        name: data.name,
      },
    });

    // Generate token
    const token = this.signToken(user.id);
    const userDTO = this.toDTO(user);
    return {
      user: userDTO,
      token,
    };
  }

  /**
   * Authenticate a user and return their data
   * @param email - User email
   * @param password - User password (plain text)
   * @returns User data without password
   */
  async login({ email, password }: AuthLoginRequest): Promise<AuthSessionDTO> {
    // Find user with password field
    const user = await prisma.user.findUnique({
      where: { email },
      omit: {
        password: false,
      },
    });

    if (!user) {
      throw new AppError(
        "Incorrect email or password",
        ErrorCode.INVALID_CREDENTIALS
      );
    }

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
    const userDTO = this.toDTO(userWithoutPassword);

    return {
      user: userDTO,
      token,
    };
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
  ): Promise<AuthSessionDTO> {
    // Get user with password field
    const user = await prisma.user.findUnique({
      where: { id: userId },
      omit: {
        password: false,
      },
    });

    if (!user) {
      throw new AppError(
        "Your current password is wrong.",
        ErrorCode.INVALID_CREDENTIALS
      );
    }

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
    const userDTO = this.toDTO(updatedUser);

    return {
      user: userDTO,
      token,
    };
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
