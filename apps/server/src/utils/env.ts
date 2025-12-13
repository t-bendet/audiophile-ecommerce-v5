import dotenv from "dotenv";
import ms from "ms";
import * as z from "zod";

dotenv.config({ override: true });

const msDurationStringCheck = z.custom<ms.StringValue>((val) => {
  return ms(val as ms.StringValue) && typeof val === "string";
}, "Invalid ms duration format");

type ConnectionString =
  `mongodb+srv://${string}:${string}@${string}/${string}?retryWrites=true&w=majority&appName=${string}`;

const connectionStringRegex =
  /^mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)\/([^?]+)\?retryWrites=true&w=majority&appName=([^&]+)$/;

const createEnv = () => {
  const EnvSchema = z.object({
    NODE_ENV: z.enum(["development", "production"]),
    PORT: z.string().min(4).max(4),
    DATABASE_URL: z.custom<ConnectionString>((val) =>
      connectionStringRegex.test(val as string)
    ),
    JWT_SECRET: z.string().min(10),
    JWT_EXPIRES_IN: msDurationStringCheck,
    JWT_COOKIE_EXPIRES_IN: z.string(),
  });

  const parsedEnv = EnvSchema.safeParse(process.env);

  if (!parsedEnv.success) {
    throw new Error(
      `Invalid env provided.
      The following variables are missing or invalid:
    ${z.prettifyError(parsedEnv.error)}`
    );
  }
  return parsedEnv.data;
};

export const env = createEnv();
