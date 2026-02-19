import express from "express";
import authRouter from "./auth.route.js";
import cartRouter from "./cart.route.js";
import categoryRouter from "./category.route.js";
import healthRouter from "./health.route.js";
import userRouter from "./user.route.js";

const indexRoute: express.Router = express.Router();

indexRoute.use("/health", healthRouter);
indexRoute.use("/users", userRouter);
indexRoute.use("/auth", authRouter);
indexRoute.use("/categories", categoryRouter);
indexRoute.use("/cart", cartRouter);

export default indexRoute;
