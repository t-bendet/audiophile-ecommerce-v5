import express from "express";
import * as testController from "../controllers/test.controller.js";

/**
 * Mounted only under `NODE_ENV=test` (see `routes/index.ts`), the one switch
 * that already stands the rate limiters down. Everywhere else the path is the
 * JSON 404 every unknown API path gets.
 */
const testRouter: express.Router = express.Router();

testRouter.get("/outbox", ...testController.readOutbox);
testRouter.delete("/outbox", testController.clearOutbox);

export default testRouter;
