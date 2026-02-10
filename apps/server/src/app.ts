import { AppError, ErrorCode, UserPublicInfo } from "@repo/domain";
import cors from "cors";
import express, { Express } from "express";
import globalErrorHandler from "./middlewares/error.middleware.js";
import indexRoute from "./routes/index.js";
import { env } from "./utils/env.js";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

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

app.use(express.json());

// CORS configuration - supports both dev and production
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

app.use(helmet());

// Development logging
if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Limit requests from same API
const limiter = rateLimit({
  limit: 100,
  windowMs: 15 * 60 * 1000,
  message: "Too many requests from this IP, please try again in 15 minutes!",
});

app.use("/api", limiter);

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
