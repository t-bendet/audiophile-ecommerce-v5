import express from "express";
import globalErrorHandler from "./middlewares/error.middleware";
import indexRoute from "./routes";
import { UserPublicInfo } from "./schemas/user.schema";
import AppError from "./utils/appError";

declare global {
  namespace Express {
    export interface Request {
      user?: UserPublicInfo;
    }
  }
}

const app = express();
app.set("query parser", "extended");

app.use(express.json());

app.use("/api/v1", indexRoute);

app.all(/.*/, (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export default app;
