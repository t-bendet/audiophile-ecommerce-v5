import type { MiddlewareFunction } from "react-router";

export const errorMiddleware: MiddlewareFunction = async (
  // scaffold for future use
  _context,
  next,
) => {
  const start = performance.now();
  const response = await next();
  const duration = performance.now() - start;

  if (import.meta.env.DEV) {
    console.log(`Navigation took ${duration}ms`);
  }

  return response;
};
