import { AppError, ErrorCode } from "@repo/domain";
import cookieParser from "cookie-parser";
import express, { Express } from "express";
import helmet from "helmet";
import globalErrorHandler from "./middlewares/error.middleware.js";
import indexRoute from "./routes/index.js";
import { httpLogger } from "./utils/logger.js";
import { apiLimiter } from "./utils/rateLimiters.js";

const app: Express = express();
app.set("query parser", "extended");

// Trust the proxy in front of the app - required for secure cookies
app.set("trust proxy", 1);

// 1. Logging - first in the chain so every request, including the ones the
// rate limiter rejects, gets a request id and a log line
app.use(httpLogger);

// 2. Security headers - set on every response
app.use(helmet());

// 3. Rate limiting - reject abusive requests before parsing body
app.use("/api", apiLimiter);

// 4. Body parsers - parse only legitimate requests
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// 5. Cookie parser
app.use(cookieParser());

// 6. Routes
app.use("/api/v1", indexRoute);

app.all(/.*/, (req, _res, next) => {
  next(
    new AppError(
      `Can't find ${req.originalUrl} on this server!`,
      ErrorCode.NOT_FOUND,
    ),
  );
});

app.use(globalErrorHandler);

export default app;
