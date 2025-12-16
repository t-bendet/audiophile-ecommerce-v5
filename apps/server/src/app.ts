import { AppError, ErrorCode, UserPublicInfo } from "@repo/domain";
import express, { Express } from "express";
import globalErrorHandler from "./middlewares/error.middleware.js";
import indexRoute from "./routes/index.js";

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

app.use("/api/v1", indexRoute);

app.all(/.*/, (req, res, next) => {
  next(
    new AppError(
      `Can't find ${req.originalUrl} on this server!`,
      ErrorCode.NOT_FOUND
    )
  );
});

app.use(globalErrorHandler);

export default app;
