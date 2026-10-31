import {
  ErrorCode,
  ErrorDetail,
  ErrorResponse,
  getStatusCode,
} from "@repo/domain";
import { AnyFieldApi, FieldApi, FormApi } from "@tanstack/react-form";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { normalizeError } from "../src/lib/errors/errors";
import { applyServerErrors } from "../src/lib/errors/form-errors";

const UNMATCHED_MESSAGE =
  "We couldn't accept this form. Please refresh the page and try again.";

const axiosServerError = (code: ErrorCode, details?: ErrorDetail[]) => {
  const statusCode = getStatusCode(code);
  const body: ErrorResponse = {
    success: false,
    timestamp: new Date().toISOString(),
    data: null,
    error: { code, message: `server says ${code}`, statusCode, details },
  };

  const error = new AxiosError<ErrorResponse>(
    "Request failed",
    statusCode >= 500 ? "ERR_BAD_RESPONSE" : "ERR_BAD_REQUEST",
  );
  error.response = {
    data: body,
    status: statusCode,
    statusText: "",
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
  };

  return normalizeError(error);
};

const detail = (path: string[] | undefined, message = "Invalid") => ({
  code: "custom",
  message,
  path,
});

// Registration order mirrors the render order of a real form.
const FIELD_NAMES = ["email", "password", "shippingAddress.zipCode"] as const;

const createSubmittedForm = async () => {
  const form = new FormApi({
    defaultValues: {
      email: "",
      password: "",
      shippingAddress: { zipCode: "" },
    },
    // FormApi defaults TSubmitMeta to never, which AnyFormApi does not accept.
    onSubmitMeta: undefined,
  });
  form.mount();
  const fields = Object.fromEntries(
    FIELD_NAMES.map((name) => {
      const field = new FieldApi({ form, name });
      field.mount();
      return [name, field];
    }),
  ) as Record<(typeof FIELD_NAMES)[number], AnyFieldApi>;
  // handleSubmit marks every field touched, as it does before the mutation runs.
  await form.handleSubmit();
  return { form, fields };
};

let focused: string[];

beforeEach(() => {
  focused = [];
  vi.stubGlobal("document", {
    getElementById: (id: string) => ({ focus: () => focused.push(id) }),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("applyServerErrors", () => {
  it("puts a body field detail on its field and focuses it, with no toast", async () => {
    const { form, fields } = await createSubmittedForm();
    const error = axiosServerError(ErrorCode.VALIDATION_ERROR, [
      detail(["body", "email"], "Invalid email address"),
    ]);

    const message = applyServerErrors(form, error);

    expect(message).toBeUndefined();
    expect(fields.email.state.meta.errors).toEqual([
      { message: "Invalid email address" },
    ]);
    expect(fields.password.state.meta.errors).toEqual([]);
    expect(focused).toEqual(["email"]);
  });

  it("maps a nested body path to the dotted field name", async () => {
    const { form, fields } = await createSubmittedForm();
    const error = axiosServerError(ErrorCode.VALIDATION_ERROR, [
      detail(["body", "shippingAddress", "zipCode"], "Invalid ZIP code"),
    ]);

    const message = applyServerErrors(form, error);

    expect(message).toBeUndefined();
    expect(fields["shippingAddress.zipCode"].state.meta.errors).toEqual([
      { message: "Invalid ZIP code" },
    ]);
    expect(focused).toEqual(["shippingAddress.zipCode"]);
  });

  it("focuses the first field in registration order, not detail order", async () => {
    const { form, fields } = await createSubmittedForm();
    const error = axiosServerError(ErrorCode.VALIDATION_ERROR, [
      detail(["body", "shippingAddress", "zipCode"], "Invalid ZIP code"),
      detail(["body", "password"], "Too short"),
    ]);

    applyServerErrors(form, error);

    expect(fields.password.state.meta.errors).toEqual([
      { message: "Too short" },
    ]);
    expect(fields["shippingAddress.zipCode"].state.meta.errors).toEqual([
      { message: "Invalid ZIP code" },
    ]);
    expect(focused).toEqual(["password"]);
  });

  it.each([
    ["an unregistered body key", ["body", "role"]],
    ["the body root", ["body"]],
    ["a query parameter", ["query", "limit"]],
    ["no path", undefined],
  ])(
    "returns the fixed message for %s and still applies matched details",
    async (_, path) => {
      const { form, fields } = await createSubmittedForm();
      const error = axiosServerError(ErrorCode.VALIDATION_ERROR, [
        detail(["body", "email"], "Invalid email address"),
        detail(path, 'Unrecognized key: "role"'),
      ]);

      const message = applyServerErrors(form, error);

      expect(message).toBe(UNMATCHED_MESSAGE);
      expect(fields.email.state.meta.errors).toEqual([
        { message: "Invalid email address" },
      ]);
      expect(focused).toEqual(["email"]);
    },
  );

  it("returns the fixed message for a validation error without details", async () => {
    const { form } = await createSubmittedForm();
    const error = axiosServerError(ErrorCode.VALIDATION_ERROR);

    expect(applyServerErrors(form, error)).toBe(UNMATCHED_MESSAGE);
    expect(focused).toEqual([]);
  });

  it.each([
    ErrorCode.INVALID_CREDENTIALS,
    ErrorCode.DUPLICATE_ENTRY,
    ErrorCode.INTERNAL_ERROR,
  ])("returns the message of %s and leaves the fields alone", async (code) => {
    const { form, fields } = await createSubmittedForm();
    const error = axiosServerError(code);

    expect(applyServerErrors(form, error)).toBe(error.message);
    for (const field of Object.values(fields)) {
      expect(field.state.meta.errors).toEqual([]);
    }
    expect(focused).toEqual([]);
  });

  it("clears a server error when the shopper edits the field", async () => {
    const { form, fields } = await createSubmittedForm();
    applyServerErrors(
      form,
      axiosServerError(ErrorCode.VALIDATION_ERROR, [
        detail(["body", "email"], "Invalid email address"),
        detail(["body", "password"], "Too short"),
      ]),
    );

    fields.email.handleChange("shopper@example.com");

    expect(fields.email.state.meta.errors).toEqual([]);
    expect(fields.password.state.meta.errors).toEqual([
      { message: "Too short" },
    ]);
  });
});
