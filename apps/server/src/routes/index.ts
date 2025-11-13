import express from "express";
import categoryRouter from "./category.route.js";
import productRouter from "./product.route.js";
import userRouter from "./user.route.js";
import configRouter from "./config.route.js";
import authRouter from "./auth.route.js";

const indexRoute: express.Router = express.Router();

indexRoute.use("/users", userRouter);
indexRoute.use("/auth", authRouter); // Assuming userRouter handles auth as well
indexRoute.use("/categories", categoryRouter);
indexRoute.use("/products", productRouter);
indexRoute.use("/config", configRouter);

export default indexRoute;
