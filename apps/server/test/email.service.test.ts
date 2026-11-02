import type { OrderDTO } from "@repo/domain";
import type { Logger } from "pino";
import { describe, expect, it, vi } from "vitest";
import { createEmailService } from "../src/services/email.service.js";
import { Outbox, type EmailTransport } from "../src/utils/email.js";
import type { PasswordResetIssue } from "../src/utils/password-reset-token.js";

const CLIENT_URL = "https://shop.example.com";

const order: OrderDTO = {
  id: "507f1f77bcf86cd799439011",
  userId: "507f1f77bcf86cd799439012",
  items: [],
  status: "PENDING",
  subtotal: 0,
  shippingCost: 50,
  tax: 0,
  total: 50,
  shippingAddress: {
    fullName: "Ada Lovelace",
    email: "ada@example.com",
    phone: "555-0100",
    address: "1 Analytical Way",
    city: "London",
    state: "London",
    zipCode: "E1 6AN",
    country: "UK",
  },
  billingAddress: {
    fullName: "Ada Lovelace",
    address: "1 Analytical Way",
    city: "London",
    state: "London",
    zipCode: "E1 6AN",
    country: "UK",
  },
  paymentMethod: "Cash on Delivery",
  paymentStatus: "PENDING",
  createdAt: new Date("2026-11-02T10:00:00Z"),
  updatedAt: new Date("2026-11-02T10:00:00Z"),
};

const fakeLogger = () => {
  const error = vi.fn();
  return { error, log: { error } as unknown as Logger };
};

describe("emailService.sendOrderConfirmation", () => {
  it("hands the rendered confirmation to the transport", async () => {
    const outbox = new Outbox();
    const { log, error } = fakeLogger();

    await createEmailService(outbox, CLIENT_URL).sendOrderConfirmation(
      order,
      log,
    );

    expect(outbox.addressedTo("ada@example.com")).toHaveLength(1);
    expect(error).not.toHaveBeenCalled();
  });

  it("logs a failed send with the error and the order id, and resolves", async () => {
    const failure = new Error("Resend answered 500: Internal server error");
    const transport: EmailTransport = { send: () => Promise.reject(failure) };
    const { log, error } = fakeLogger();

    await expect(
      createEmailService(transport, CLIENT_URL).sendOrderConfirmation(
        order,
        log,
      ),
    ).resolves.toBeUndefined();

    expect(error).toHaveBeenCalledWith(
      { err: failure, orderId: "507f1f77bcf86cd799439011" },
      "order confirmation email failed",
    );
  });
});

const issue: PasswordResetIssue = {
  user: {
    id: "507f1f77bcf86cd799439012",
    email: "ada@example.com",
    name: "Ada Lovelace",
  },
  token: "a".repeat(64),
  expiresAt: new Date("2026-11-02T11:00:00Z"),
};

describe("emailService.sendPasswordReset", () => {
  it("hands the rendered reset email, linked on the client url, to the transport", async () => {
    const outbox = new Outbox();
    const { log, error } = fakeLogger();

    await createEmailService(outbox, CLIENT_URL).sendPasswordReset(issue, log);

    const [email, ...others] = outbox.addressedTo("ada@example.com");
    expect(others).toEqual([]);
    expect(email!.text).toContain(
      `https://shop.example.com/auth/reset-password?token=${issue.token}`,
    );
    expect(error).not.toHaveBeenCalled();
  });

  it("logs a failed send with the error and the user id, never the token, and resolves", async () => {
    const failure = new Error("Resend answered 500: Internal server error");
    const transport: EmailTransport = { send: () => Promise.reject(failure) };
    const { log, error } = fakeLogger();

    await expect(
      createEmailService(transport, CLIENT_URL).sendPasswordReset(issue, log),
    ).resolves.toBeUndefined();

    expect(error).toHaveBeenCalledWith(
      { err: failure, userId: "507f1f77bcf86cd799439012" },
      "password reset email failed",
    );
  });
});
