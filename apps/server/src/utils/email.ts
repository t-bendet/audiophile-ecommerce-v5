import type { Logger } from "pino";
import { env } from "./env.js";
import { logger } from "./logger.js";

/**
 * The one email seam. Every message the server sends is rendered first, then
 * handed to the transport `NODE_ENV` selects: an in-memory outbox under test,
 * Resend over HTTPS when a key is configured, and the logger otherwise.
 */

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
  /** Resend's `Idempotency-Key`, named after the business event: `<event>/<entity id>`. */
  idempotencyKey: string;
};

export type EmailTransport = {
  send(message: EmailMessage): Promise<void>;
};

const SENDER_NAME = "Audiophile";

/** The display name lives here; `EMAIL_FROM` holds only the address. */
export const formatSender = (address: string): string =>
  `${SENDER_NAME} <${address}>`;

/**
 * Keeps every message in memory. Route tests read it directly and the E2E suite
 * through the test-only outbox route.
 */
export class Outbox implements EmailTransport {
  readonly messages: EmailMessage[] = [];

  async send(message: EmailMessage): Promise<void> {
    this.messages.push(message);
  }

  /** The messages addressed to `email`, oldest first. */
  addressedTo(email: string): EmailMessage[] {
    return this.messages.filter((message) => message.to === email);
  }

  clear(): void {
    this.messages.length = 0;
  }
}

/** Development without a key: the rendered message is visible in the terminal. */
export const createLogTransport = (log: Logger): EmailTransport => ({
  async send(message) {
    log.info(
      { email: message },
      "email not sent: EMAIL_API_KEY is unset, rendered message follows",
    );
  },
});

const RESEND_SEND_URL = "https://api.resend.com/emails";

type ResendTransportOptions = {
  apiKey: string;
  /** The full sender, display name included; see `formatSender`. */
  from: string;
  fetch?: typeof globalThis.fetch;
};

/**
 * One POST per message, as Resend's send endpoint documents it. A reused
 * idempotency key within 24 hours returns the first send's result, so a
 * retried checkout cannot send twice.
 */
export const createResendTransport = ({
  apiKey,
  from,
  fetch = globalThis.fetch,
}: ResendTransportOptions): EmailTransport => ({
  async send({ to, subject, text, html, idempotencyKey }) {
    const response = await fetch(RESEND_SEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({ from, to: [to], subject, text, html }),
    });

    if (!response.ok) {
      throw new Error(
        `Resend answered ${response.status}: ${await resendErrorMessage(response)}`,
      );
    }
  },
});

const resendErrorMessage = async (response: Response): Promise<string> => {
  const body: unknown = await response.json().catch(() => null);
  if (
    body !== null &&
    typeof body === "object" &&
    "message" in body &&
    typeof body.message === "string"
  ) {
    return body.message;
  }
  return response.statusText;
};

export const outbox = new Outbox();

const selectTransport = (): EmailTransport => {
  if (env.NODE_ENV === "test") return outbox;
  if (env.EMAIL_API_KEY) {
    return createResendTransport({
      apiKey: env.EMAIL_API_KEY,
      from: formatSender(env.EMAIL_FROM),
    });
  }
  return createLogTransport(logger);
};

export const emailTransport: EmailTransport = selectTransport();
