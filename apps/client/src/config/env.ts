import * as z from "zod";

const createEnv = () => {
  const EnvSchema = z.object({
    API_PROXY_PORT: z.string(),
    PORT: z.string(),
    MODE: z.enum(["development", "production"]),
  });

  const extractedEnvVars = Object.entries(import.meta.env).reduce<
    Record<string, string>
  >((acc, curr) => {
    const [key, value] = curr;
    if (key.startsWith("VITE_APP_")) {
      acc[key.replace("VITE_APP_", "")] = value;
    } else {
      acc[key] = value; // Keep other env variables as is
    }
    return acc;
  }, {});

  const parsedEnv = EnvSchema.safeParse(extractedEnvVars);

  if (!parsedEnv.success) {
    throw new Error(
      `Invalid env provided.
      The following variables are missing or invalid:
    ${z.prettifyError(parsedEnv.error)}`,
    );
  }

  return parsedEnv.data;
};

export const env = createEnv();
