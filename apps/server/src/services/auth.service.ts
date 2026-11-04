import { prisma } from "@repo/database";
import {
  ACCOUNT_DEACTIVATED_MESSAGE,
  AppError,
  AuthLoginRequest,
  AuthSignUpRequest,
  ErrorCode,
  PASSWORD_RESET_EXPIRY_MS,
  UserDTO,
  UserPublicInfo,
} from "@repo/domain";
import jwt from "jsonwebtoken";
import { env } from "../utils/env.js";
import { isJwtError, toJwtAppError } from "../utils/jwt-errors.js";
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
  type PasswordResetIssue,
} from "../utils/password-reset-token.js";
import {
  isRecordNotFoundError,
  isUniqueConstraintError,
} from "../utils/prisma-errors.js";

type AuthSessionDTO = {
  user: UserDTO;
  token: string;
};

const EMAIL_UNIQUE_INDEX = "email_1";
const EMAIL_TAKEN = "An account with this email already exists.";

export const isEmailTakenError = (err: unknown): boolean =>
  isUniqueConstraintError(err) && err.meta?.target === EMAIL_UNIQUE_INDEX;

export const emailTakenError = () =>
  new AppError(EMAIL_TAKEN, ErrorCode.DUPLICATE_ENTRY, undefined, [
    { code: "duplicate", message: EMAIL_TAKEN, path: ["body", "email"] },
  ]);

const RESET_TOKEN_INVALID = "This reset link is invalid or has expired.";

// One answer for an unknown, expired or used token: the shopper's next step is the same.
const resetTokenInvalidError = () =>
  new AppError(
    RESET_TOKEN_INVALID,
    ErrorCode.PASSWORD_RESET_TOKEN_INVALID,
    undefined,
    [
      {
        code: "invalid",
        message: RESET_TOKEN_INVALID,
        path: ["body", "token"],
      },
    ],
  );

const accountDeactivatedError = () =>
  new AppError(ACCOUNT_DEACTIVATED_MESSAGE, ErrorCode.ACCOUNT_DEACTIVATED);

/**
 * AuthService handles all authentication business logic
 * Responsibilities:
 * - User registration/signup
 * - User authentication/login
 * - Password validation
 * - Token generation
 * - Password updates
 * - Password reset
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
      active: entity.active,
      createdAt: entity.createdAt,
      v: entity.v,
    } satisfies UserDTO;
  }
  /**
   * Sign a JWT token for a user
   */
  private signToken(id: string, passwordChangedAt: Date | null): string {
    return jwt.sign(
      { id, passwordChangedAt: passwordChangedAt?.getTime() ?? null },
      env.JWT_SECRET,
      {
        expiresIn: env.JWT_EXPIRES_IN,
      },
    );
  }

  /**
   * Register a new user
   * @param data - User registration data
   * @returns The created user with token
   */
  async signup(
    data: AuthSignUpRequest,
  ): Promise<{ user: UserDTO; token: string }> {
    // Create user with Prisma (password hashing happens via schema defaults)
    const user = await prisma.user
      .create({
        data: {
          email: data.email,
          password: data.password,
          passwordConfirm: data.passwordConfirm,
          name: data.name,
        },
      })
      .catch((err: unknown) => {
        // Other unique failures keep the generic duplicate handling at the boundary.
        if (isEmailTakenError(err)) throw emailTakenError();
        throw err;
      });

    // Generate token
    const token = this.signToken(user.id, user.passwordChangedAt);
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
        ErrorCode.INVALID_CREDENTIALS,
      );
    }

    // Validate password using Prisma's custom method
    const isPasswordValid = await prisma.user.validatePassword(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new AppError(
        "Incorrect email or password",
        ErrorCode.INVALID_CREDENTIALS,
      );
    }

    // Only the right password learns that the account is deactivated.
    if (!user.active) {
      throw accountDeactivatedError();
    }

    // Generate token
    const token = this.signToken(user.id, user.passwordChangedAt);

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
    newPassword: string,
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
        ErrorCode.INVALID_CREDENTIALS,
        undefined,
        [
          {
            code: "invalid",
            message: "Your current password is wrong.",
            path: ["body", "currentPassword"],
          },
        ],
      );
    }

    // Validate current password
    const isPasswordValid = await prisma.user.validatePassword(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new AppError(
        "Your current password is wrong.",
        ErrorCode.INVALID_CREDENTIALS,
        undefined,
        [
          {
            code: "invalid",
            message: "Your current password is wrong.",
            path: ["body", "currentPassword"],
          },
        ],
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
    const token = this.signToken(updatedUser.id, updatedUser.passwordChangedAt);
    const userDTO = this.toDTO(updatedUser);

    return {
      user: userDTO,
      token,
    };
  }

  /**
   * Issue a password reset token for the active user with this email, replacing
   * any earlier one, so only the latest link works. Answers null for an unknown
   * or deactivated email; the caller responds the same either way.
   */
  async issuePasswordResetToken(
    email: string,
  ): Promise<PasswordResetIssue | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.active) return null;

    const { token, tokenHash } = generatePasswordResetToken();
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: tokenHash, passwordResetExpires: expiresAt },
    });

    return {
      user: { id: user.id, email: user.email, name: user.name },
      token,
      expiresAt,
    };
  }

  /**
   * Set a new password from an emailed reset token and sign the user in. The
   * token is cleared in the same write, so it works once; the password change
   * moves `passwordChangedAt`, which ends every session signed in before it.
   */
  async resetPassword(
    token: string,
    password: string,
  ): Promise<AuthSessionDTO> {
    const tokenHash = hashPasswordResetToken(token);
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: tokenHash,
        passwordResetExpires: { gt: new Date() },
      },
    });
    if (!user) throw resetTokenInvalidError();
    if (!user.active) throw accountDeactivatedError();

    // `update`, not `updateMany`: only the update hook hashes the password. The
    // token in the filter makes this write the single-use guard: a concurrent
    // reset that cleared it first leaves no record to update.
    const updatedUser = await prisma.user
      .update({
        where: { id: user.id, passwordResetToken: tokenHash },
        data: {
          password,
          passwordConfirm: password,
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      })
      .catch((err: unknown) => {
        if (isRecordNotFoundError(err)) throw resetTokenInvalidError();
        throw err;
      });

    // Signed after the write, so `passwordChangedAt` does not end this session.
    return {
      user: this.toDTO(updatedUser),
      token: this.signToken(updatedUser.id, updatedUser.passwordChangedAt),
    };
  }

  /**
   * Verify and decode a JWT token
   * @param token - JWT token string
   * @returns Decoded token payload
   */
  private verifyToken(token: string): jwt.JwtPayload {
    let decoded: string | jwt.JwtPayload;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (error) {
      // Classified here, not at the boundary, so checkIsAuthenticated can read it.
      if (!isJwtError(error)) throw error;
      throw toJwtAppError(error);
    }
    if (!decoded || typeof decoded === "string") {
      throw new AppError("Invalid token", ErrorCode.INVALID_TOKEN);
    }
    return decoded;
  }

  async checkIsAuthenticated(token: string | null): Promise<boolean> {
    const tokenValidationErrors = [
      ErrorCode.UNAUTHORIZED,
      ErrorCode.INVALID_TOKEN,
      ErrorCode.TOKEN_EXPIRED,
      ErrorCode.ACCOUNT_DEACTIVATED,
    ];
    try {
      await this.validateTokenAndGetUser(token);
      return true;
    } catch (error) {
      if (
        error instanceof AppError &&
        tokenValidationErrors.includes(error.code)
      ) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Resolve the user a JWT token names, or throw the reason the session is over.
   */
  async validateTokenAndGetUser(token: string | null): Promise<UserPublicInfo> {
    //* 1) Validate Token
    if (token === null) {
      throw new AppError(
        "You ar not logged in! Please log in to gain access",
        ErrorCode.UNAUTHORIZED,
      );
    }
    const decoded = this.verifyToken(token);

    // //* 2) check if user still exists
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!currentUser) {
      throw new AppError(
        "The user belonging to this token does no longer exists",
        ErrorCode.UNAUTHORIZED,
      );
    }

    // //* 3) a deactivated account's session ends on its next request
    if (!currentUser.active) {
      throw accountDeactivatedError();
    }

    // //* 4) check if user changed password after the token was issued
    if (currentUser.passwordChangedAt) {
      // Older tokens have only second-resolution iat; new tokens carry the exact password version.
      const hasPasswordChanged =
        decoded.passwordChangedAt === undefined
          ? decoded.iat! * 1000 < currentUser.passwordChangedAt.getTime()
          : decoded.passwordChangedAt !==
            currentUser.passwordChangedAt.getTime();
      if (hasPasswordChanged) {
        throw new AppError(
          "User recently changed password! Please log in to again",
          ErrorCode.UNAUTHORIZED,
        );
      }
    }

    return currentUser;
  }
}

export const authService = new AuthService();
