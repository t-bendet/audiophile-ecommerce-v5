import {
  createEmptyResponse,
  createRequestSchema,
  createSingleItemResponse,
} from "@repo/domain";
import type express from "express";
import { z } from "zod";
import { outbox } from "../utils/email.js";
import { defineHandler, ValidatedHandler } from "../utils/define-handler.js";

/**
 * Test-only reads of the email outbox, for the E2E suite, which drives the
 * system over HTTP and imports no server code. No client calls this route, so
 * its schema stays out of `@repo/domain`.
 */

const ReadOutboxRequestSchema = createRequestSchema({
  query: z.object({ to: z.email().optional() }).strict(),
});

/** The messages sent so far, oldest first; `to` narrows to one recipient. */
export const readOutbox: ValidatedHandler = defineHandler(
  ReadOutboxRequestSchema,
  async (req, res) => {
    const { to } = req.verified.query;
    res
      .status(200)
      .json(
        createSingleItemResponse(to ? outbox.addressedTo(to) : outbox.messages),
      );
  },
);

export const clearOutbox = (
  _req: express.Request,
  res: express.Response,
): void => {
  outbox.clear();
  res.status(200).json(createEmptyResponse());
};
