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

// Minimal CORS for dev when calling API directly from Vite (5173)
if (process.env.NODE_ENV === "development") {
  const devOrigin = `http://localhost:${process.env.VITE_APP_PORT || 5173}`;
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", devOrigin);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    res.header(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    );
    // Respond immediately to CORS preflight requests without processing further    if (req.method === "OPTIONS")

    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });
}

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
