import "http";

declare module "http" {
  interface ServerResponse {
    // Set by the error boundary; pino-http reads it as the completion line's level.
    errLogLevel?: "warn" | "error";
  }
}
