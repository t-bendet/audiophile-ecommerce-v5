import { ErrorCode, ErrorDetail, getStatusCode } from "@repo/domain";

class AppError extends Error {
  statusCode;
  code;
  details?: ErrorDetail[];

  constructor(
    message: string,
    code: ErrorCode,
    statusCode?: number,
    details?: ErrorDetail[]
  ) {
    super(message);

    this.code = code;
    this.details = details;
    // Auto-derive status code from error code if not provided
    this.statusCode = statusCode ?? getStatusCode(code);

    // uncomment this line to get the name of the error class in the stack trace
    // This line is commented out because it can cause issues with stack traces in some environments
    // this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
