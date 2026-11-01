import { AppError, ErrorCode, ErrorDetail } from "@repo/domain";
import { AnyFormApi } from "@tanstack/react-form";

const UNMATCHED_SERVER_ERROR_MESSAGE =
  "We couldn't accept this form. Please refresh the page and try again.";

const toFieldName = (path: ErrorDetail["path"]): string | undefined => {
  if (!path || path[0] !== "body" || path.length < 2) return undefined;
  return path.slice(1).join(".");
};

// Validation messages are written for developers; every other code's message is for shoppers.
const unmatchedMessage = (error: AppError): string =>
  error.code === ErrorCode.VALIDATION_ERROR
    ? UNMATCHED_SERVER_ERROR_MESSAGE
    : error.message;

/** Puts server field errors on their fields; returns the toast message, if any. */
export function applyServerErrors(
  form: AnyFormApi,
  error: AppError,
): string | undefined {
  const details = error.details ?? [];
  if (details.length === 0) return unmatchedMessage(error);

  const fieldNames = Object.keys(form.fieldInfo);
  const fields: Record<string, { message: string }[]> = {};
  let hasUnmatched = false;

  for (const detail of details) {
    const name = toFieldName(detail.path);
    if (name === undefined || !fieldNames.includes(name)) {
      hasUnmatched = true;
      continue;
    }
    (fields[name] ??= []).push({ message: detail.message });
  }

  form.setErrorMap({ onSubmit: { fields } });

  const firstMatched = fieldNames.find((name) => name in fields);
  if (firstMatched) document.getElementById(firstMatched)?.focus();

  return hasUnmatched ? unmatchedMessage(error) : undefined;
}
