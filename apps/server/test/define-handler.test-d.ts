import type {
  GetOrderRequestSchema,
  ProductGetAllRequestSchema,
  UpdateOrderStatusRequestSchema,
} from "@repo/domain";
import express, { type Response } from "express";
import { describe, expectTypeOf, it } from "vitest";
import type { ValidatedRequest } from "../src/types/validated-request.js";
import {
  defineHandler,
  type ValidatedHandler,
} from "../src/utils/define-handler.js";

declare const GetOrder: typeof GetOrderRequestSchema;
declare const ListProducts: typeof ProductGetAllRequestSchema;
declare const UpdateOrderStatus: typeof UpdateOrderStatusRequestSchema;

describe("defineHandler", () => {
  it("infers req.verified from the schema argument alone", () => {
    defineHandler(UpdateOrderStatus, async (req) => {
      expectTypeOf(req.verified.params).toEqualTypeOf<{ orderId: string }>();
      expectTypeOf(req.verified.body.status).toEqualTypeOf<
        "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED"
      >();
    });

    defineHandler(ListProducts, async (req) => {
      expectTypeOf(req.verified.query.name).toEqualTypeOf<string | undefined>();
    });
  });

  it("rejects a field the schema does not declare", () => {
    defineHandler(GetOrder, async (req) => {
      // @ts-expect-error the schema declares `orderId`, not `id`
      expectTypeOf(req.verified.params.id);
      // @ts-expect-error this route validates no body
      expectTypeOf(req.verified.body.status);
    });
  });

  it("rejects a handler written against a different schema", () => {
    const readsOrderStatus = async (
      req: ValidatedRequest<typeof UpdateOrderStatusRequestSchema>,
      res: Response,
    ) => {
      res.json({ status: req.verified.body.status });
    };

    // @ts-expect-error the handler reads a body `GetOrder` does not validate
    defineHandler(GetOrder, readsOrderStatus);
  });

  it("spreads into a router without a cast", () => {
    const router = express.Router();
    const handler = defineHandler(GetOrder, async (req, res) => {
      res.json({ orderId: req.verified.params.orderId });
    });

    expectTypeOf(handler).toEqualTypeOf<ValidatedHandler>();
    router.get("/:orderId", ...handler);
    router
      .route("/:orderId")
      .patch(
        ...defineHandler(UpdateOrderStatus, async (_req, res) => res.end()),
      );
  });
});
