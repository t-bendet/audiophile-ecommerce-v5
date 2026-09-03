import { AppError, ErrorCode } from "@repo/domain";
import rateLimit, { type RateLimitRequestHandler } from "express-rate-limit";

/**
 * Rate limiters. `apiLimiter` caps traffic to the whole API; the rest are
 * stricter per-route quotas on the endpoints worth abusing.
 */

type RateLimiterOptions = {
  /** Requests allowed per window, per IP. */
  limit: number;
  windowMs: number;
  /** Sent to the client verbatim as the error envelope's `message`. */
  message: string;
  /** Successful requests are refunded, so only failures burn the quota. */
  skipSuccessfulRequests?: boolean;
};

/**
 * A rejection is an error like any other: it leaves through `next()` so the
 * global error middleware shapes it into the same envelope every other failure
 * uses, under `ErrorCode.TOO_MANY_REQUESTS` (429). `express-rate-limit` has
 * already set `RateLimit-*` and `Retry-After` on the response by the time
 * `handler` runs, and `res.json()` does not clear them, so the retry
 * information still reaches the client.
 *
 * `message` is deliberately not forwarded to `rateLimit()` - overriding
 * `handler` means the library never reads it, and leaving it in would be a
 * second, dead source of truth.
 */
export const createRateLimiter = ({
  message,
  ...options
}: RateLimiterOptions): RateLimitRequestHandler =>
  rateLimit({
    ...options,
    standardHeaders: true, // RateLimit-* (draft-6)
    legacyHeaders: false, // no X-RateLimit-*
    handler: (_req, _res, next) => {
      next(new AppError(message, ErrorCode.TOO_MANY_REQUESTS));
    },
  });

/**
 * Global API limiter - a flood cap on the whole API, not a per-endpoint policy.
 * 500 requests per 15 minutes per IP (SPAs make many calls per page).
 */
export const apiLimiter: RateLimitRequestHandler = createRateLimiter({
  limit: 500,
  windowMs: 15 * 60 * 1000,
  message: "Too many requests from this IP, please try again in 15 minutes!",
});

/**
 * Login rate limiter - protects against brute force attacks
 * 10 attempts per 15 minutes per IP
 */
export const loginLimiter: RateLimitRequestHandler = createRateLimiter({
  limit: 10,
  windowMs: 15 * 60 * 1000,
  message: "Too many login attempts. Please try again in 15 minutes.",
  skipSuccessfulRequests: true, // Don't count successful logins
});

/**
 * Signup rate limiter - prevents account creation spam
 * 5 signups per hour per IP
 */
export const signupLimiter: RateLimitRequestHandler = createRateLimiter({
  limit: 5,
  windowMs: 60 * 60 * 1000,
  message: "Too many accounts created. Please try again in an hour.",
});

/**
 * Order creation limiter - prevents order spam
 * 20 orders per hour per IP
 */
export const createOrderLimiter: RateLimitRequestHandler = createRateLimiter({
  limit: 20,
  windowMs: 60 * 60 * 1000,
  message: "Too many orders placed. Please try again later.",
});

/**
 * Password reset limiter - prevents email spam
 * 3 requests per hour per IP
 *
 * Not mounted yet: the routes it guards are still commented out in
 * `routes/auth.route.ts`. It holds the intended policy until they land.
 */
export const passwordResetLimiter: RateLimitRequestHandler = createRateLimiter({
  limit: 3,
  windowMs: 60 * 60 * 1000,
  message: "Too many password reset requests. Please try again in an hour.",
});
