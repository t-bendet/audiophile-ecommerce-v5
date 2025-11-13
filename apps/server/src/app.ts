import express, { Express } from "express";
import globalErrorHandler from "./middlewares/error.middleware.js";
import indexRoute from "./routes/index.js";
import { UserPublicInfo } from "./schemas/user.schema.js";
import AppError from "./utils/appError.js";

declare global {
  namespace Express {
    export interface Request {
      user?: UserPublicInfo;
    }
  }
}

const app: Express = express();
app.set("query parser", "extended");

app.use(express.json());

app.use("/api/v1", indexRoute);

app.all(/.*/, (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export default app;
