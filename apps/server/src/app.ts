import { AppError, ErrorCode, UserPublicInfo } from "@repo/domain";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Express } from "express";
import helmet from "helmet";
import globalErrorHandler from "./middlewares/error.middleware.js";
import indexRoute from "./routes/index.js";
import { env } from "./utils/env.js";
import { httpLogger } from "./utils/logger.js";
import { apiLimiter } from "./utils/rateLimiters.js";

declare global {
  namespace Express {
    export interface Request {
      user?: UserPublicInfo;
      verified?: Record<string, any>;
    }
  }
}

const app: Express = express();
app.set("query parser", "extended");

// Trust reverse proxy (Render, Railway, etc.) - required for secure cookies
app.set("trust proxy", 1);

// 1. Logging - first in the chain so every request, including the ones CORS
// and the rate limiter reject, gets a request id and a log line
app.use(httpLogger);

// 2. CORS - handle preflight immediately, reject disallowed origins early
const allowedOrigins: string[] = env.ALLOWED_ORIGINS?.split(",") || [];
if (env.NODE_ENV === "development") {
  allowedOrigins.push(`http://localhost:${env.VITE_APP_PORT || 5173}`);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman, etc.)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400, // Cache preflight for 24 hours
  }),
);

// 3. Rate limiting - reject abusive requests before parsing body
app.use("/api", apiLimiter);

// 4. Security headers
app.use(helmet());

// 5. Body parsers - parse only legitimate requests
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// 6. Cookie parser
app.use(cookieParser());

// 7. Routes
app.use("/api/v1", indexRoute);

app.all(/.*/, (req, res, next) => {
  next(
    new AppError(
      `Can't find ${req.originalUrl} on this server!`,
      ErrorCode.NOT_FOUND,
    ),
  );
});

app.use(globalErrorHandler);

export default app;
