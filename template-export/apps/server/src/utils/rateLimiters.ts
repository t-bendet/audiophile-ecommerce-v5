import rateLimit from "express-rate-limit";

/**
 * Rate limiters for specific routes.
 * These provide stricter limits than the global API limiter for sensitive endpoints.
 */

/**
 * Login rate limiter - protects against brute force attacks
 * 10 attempts per 15 minutes per IP
 */
export const loginLimiter = rateLimit({
  limit: 10,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: {
    status: "error",
    message: "Too many login attempts. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

/**
 * Signup rate limiter - prevents account creation spam
 * 5 signups per hour per IP
 */
export const signupLimiter = rateLimit({
  limit: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: {
    status: "error",
    message: "Too many accounts created. Please try again in an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Order creation limiter - prevents order spam
 * 20 orders per hour per IP
 */
export const createOrderLimiter = rateLimit({
  limit: 20,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: {
    status: "error",
    message: "Too many orders placed. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Password reset limiter - prevents email spam
 * 3 requests per hour per IP
 */
export const passwordResetLimiter = rateLimit({
  limit: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: {
    status: "error",
    message: "Too many password reset requests. Please try again in an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
