import type {
  GetOrderRequestSchema,
  ProductGetAllRequestSchema,
  UpdateOrderStatusRequestSchema,
} from "@repo/domain";
import type { RequestHandler } from "express";
import { describe, expectTypeOf, it } from "vitest";
import type { ValidatedRequest } from "../src/types/validated-request.js";
import catchAsync from "../src/utils/catchAsync.js";

describe("ValidatedRequest", () => {
  it("narrows req.verified to the schema's inferred type", () => {
    catchAsync<ValidatedRequest<typeof UpdateOrderStatusRequestSchema>>(
      async (req) => {
        expectTypeOf(req.verified.params).toEqualTypeOf<{ orderId: string }>();
        expectTypeOf(req.verified.body.status).toEqualTypeOf<
          "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED"
        >();
      }
    );

    catchAsync<ValidatedRequest<typeof ProductGetAllRequestSchema>>(
      async (req) => {
        expectTypeOf(req.verified.query.name).toEqualTypeOf<
          string | undefined
        >();
      }
    );
  });

  it("rejects a field the schema does not declare", () => {
    catchAsync<ValidatedRequest<typeof GetOrderRequestSchema>>(async (req) => {
      // @ts-expect-error the schema declares `orderId`, not `id`
      expectTypeOf(req.verified.params.id);
      // @ts-expect-error this route validates no body
      expectTypeOf(req.verified.body.status);
    });
  });

  it("stays assignable to RequestHandler so routers need no cast", () => {
    const handler = catchAsync<ValidatedRequest<typeof GetOrderRequestSchema>>(
      async (req, res) => {
        res.json({ orderId: req.verified.params.orderId });
      }
    );

    expectTypeOf(handler).toExtend<RequestHandler>();
  });
});
