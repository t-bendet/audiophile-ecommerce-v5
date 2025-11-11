import { Router } from "express";
import categoryRouter from "./category.route";
import productRouter from "./product.route";
import userRouter from "./user.route";
import configRouter from "./config.route";
import authRouter from "./auth.route";

const indexRoute = Router();

indexRoute.use("/users", userRouter);
indexRoute.use("/auth", authRouter); // Assuming userRouter handles auth as well
indexRoute.use("/categories", categoryRouter);
indexRoute.use("/products", productRouter);
indexRoute.use("/config", configRouter);

export default indexRoute;
