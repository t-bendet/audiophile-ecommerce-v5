import express from "express";

const healthRouter: express.Router = express.Router();

/**
 * @route   GET /health
 * @desc    Health check endpoint for load balancers and monitoring
 * @access  Public
 */
healthRouter.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default healthRouter;
