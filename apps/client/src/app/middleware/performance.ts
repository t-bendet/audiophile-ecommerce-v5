import type { MiddlewareFunction } from "react-router";

export const performanceMiddleware: MiddlewareFunction = async (
  _args,
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
