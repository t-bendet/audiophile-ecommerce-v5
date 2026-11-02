import express from "express";
import adminRouter from "./admin.route.js";
import authRouter from "./auth.route.js";
import cartRouter from "./cart.route.js";
import categoryRouter from "./category.route.js";
import configRouter from "./config.route.js";
import healthRouter from "./health.route.js";
import orderRouter from "./order.route.js";
import productRouter from "./product.route.js";
import testRouter from "./test.route.js";
import userRouter from "./user.route.js";
import { env } from "../utils/env.js";

const indexRoute: express.Router = express.Router();

indexRoute.use("/health", healthRouter);
indexRoute.use("/users", userRouter);
indexRoute.use("/auth", authRouter); // Assuming userRouter handles auth as well
indexRoute.use("/categories", categoryRouter);
indexRoute.use("/products", productRouter);
indexRoute.use("/config", configRouter);
indexRoute.use("/cart", cartRouter);
indexRoute.use("/orders", orderRouter);
indexRoute.use("/admin", adminRouter);

// The email outbox the E2E suite reads; absent outside test, so a JSON 404.
if (env.NODE_ENV === "test") {
  indexRoute.use("/test", testRouter);
}

export default indexRoute;
