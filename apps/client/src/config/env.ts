import { AppError, ErrorCode } from "@repo/domain";
import * as z from "zod";

const EnvSchema = z.object({
  API_PROXY_PORT: z.string(),
  PORT: z.string(),
  MODE: z.enum(["development", "production"]),
  test: z.string(),
});

type Env = z.infer<typeof EnvSchema>;

let validatedEnv: Env | null = null;

/**
 * Validate and initialize environment variables.
 * Must be called once at app startup within ErrorBoundary context.
 * Throws AppError if validation fails.
 */
export function initializeEnv(): void {
  if (validatedEnv) return;

  const extractedEnvVars = Object.entries(import.meta.env).reduce<
    Record<string, string>
  >((acc, curr) => {
    const [key, value] = curr;
    if (key.startsWith("VITE_APP_")) {
      acc[key.replace("VITE_APP_", "")] = value;
    } else {
      acc[key] = value;
    }
    return acc;
  }, {});

  const parsedEnv = EnvSchema.safeParse(extractedEnvVars);

  if (!parsedEnv.success) {
    throw new AppError(
      `Invalid environment configuration: ${z.prettifyError(parsedEnv.error)}`,
      ErrorCode.INTERNAL_ERROR,
    );
  }
  return;
}

/**
 * Get validated environment variables.
 * Returns cached env if already initialized, otherwise throws error.
 */
export function getEnv(): Env {
  if (!validatedEnv) {
    throw new AppError(
      "Environment not initialized. Call initializeEnv() first.",
      ErrorCode.INTERNAL_ERROR,
    );
  }
  return validatedEnv;
}
