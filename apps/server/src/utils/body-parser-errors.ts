import { AppError, ErrorCode } from "@repo/domain";

const bodyParserErrorTypes = [
  "entity.too.large",
  "entity.parse.failed",
  "request.aborted",
  "entity.verify.failed",
  "encoding.unsupported",
  "charset.unsupported",
] as const;

type BodyParserError = Error & { type: (typeof bodyParserErrorTypes)[number] };

export const isBodyParserError = (err: unknown): err is BodyParserError =>
  err instanceof Error &&
  "type" in err &&
  bodyParserErrorTypes.some((type) => type === err.type);

export const toBodyParserAppError = (err: BodyParserError): AppError => {
  if (err.type === "entity.too.large") {
    return new AppError(
      "Request body exceeds 10kb",
      ErrorCode.PAYLOAD_TOO_LARGE,
    );
  }
  return new AppError("Request body is invalid", ErrorCode.INVALID_BODY);
};
