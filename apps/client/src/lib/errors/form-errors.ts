import { AppError, ErrorCode, ErrorDetail } from "@repo/domain";
import { AnyFormApi } from "@tanstack/react-form";

const UNMATCHED_SERVER_ERROR_MESSAGE =
  "We couldn't accept this form. Please refresh the page and try again.";

const toFieldName = (path: ErrorDetail["path"]): string | undefined => {
  if (!path || path[0] !== "body" || path.length < 2) return undefined;
  return path.slice(1).join(".");
};

/** Puts server validation errors on their fields; returns the toast message, if any. */
export function applyServerErrors(
  form: AnyFormApi,
  error: AppError,
): string | undefined {
  if (error.code !== ErrorCode.VALIDATION_ERROR) return error.message;

  const fieldNames = Object.keys(form.fieldInfo);
  const fields: Record<string, { message: string }[]> = {};
  const details = error.details ?? [];
  let hasUnmatched = details.length === 0;

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

  return hasUnmatched ? UNMATCHED_SERVER_ERROR_MESSAGE : undefined;
}
