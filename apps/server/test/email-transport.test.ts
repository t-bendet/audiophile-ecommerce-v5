import { describe, expect, it, vi } from "vitest";
import {
  createResendTransport,
  formatSender,
  type EmailMessage,
} from "../src/utils/email.js";

const message: EmailMessage = {
  to: "ada@example.com",
  subject: "Order received",
  text: "Thank you",
  html: "<p>Thank you</p>",
  idempotencyKey: "order-confirmation/507f1f77bcf86cd799439011",
};

const respondWith = (status: number, body: unknown) =>
  vi.fn<typeof fetch>().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    }),
  );

describe("Resend transport", () => {
  it("posts the message to Resend with the key and the idempotency key", async () => {
    const fetch = respondWith(200, { id: "e-1" });
    const transport = createResendTransport({
      apiKey: "re_test_key",
      from: formatSender("no-reply@audiophile.t-bendet.com"),
      fetch,
    });

    await transport.send(message);

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe("https://api.resend.com/emails");
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).get("authorization")).toBe(
      "Bearer re_test_key",
    );
    expect(new Headers(init?.headers).get("idempotency-key")).toBe(
      "order-confirmation/507f1f77bcf86cd799439011",
    );
    expect(new Headers(init?.headers).get("content-type")).toBe(
      "application/json",
    );
    expect(JSON.parse(String(init?.body))).toEqual({
      from: "Audiophile <no-reply@audiophile.t-bendet.com>",
      to: ["ada@example.com"],
      subject: "Order received",
      text: "Thank you",
      html: "<p>Thank you</p>",
    });
  });

  it("rejects with Resend's status and message when the send is refused", async () => {
    const transport = createResendTransport({
      apiKey: "re_test_key",
      from: formatSender("no-reply@audiophile.t-bendet.com"),
      fetch: respondWith(403, {
        statusCode: 403,
        name: "validation_error",
        message: "The audiophile.t-bendet.com domain is not verified.",
      }),
    });

    await expect(transport.send(message)).rejects.toThrow(
      /Resend answered 403: The audiophile.t-bendet.com domain is not verified\./,
    );
  });
});

describe("formatSender", () => {
  it("puts the display name in code around the configured address", () => {
    expect(formatSender("no-reply@audiophile.t-bendet.com")).toBe(
      "Audiophile <no-reply@audiophile.t-bendet.com>",
    );
  });
});
