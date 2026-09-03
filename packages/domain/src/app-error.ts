import { ErrorDetail } from "./common.js";
import { ErrorCode, getStatusCode } from "./error-codes.js";

export class AppError extends Error {
  statusCode: number;
  code: ErrorCode;
  details?: ErrorDetail[];
  // False marks our bug rather than the caller's fault; never sent to clients.
  isOperational: boolean;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode?: number,
    details?: ErrorDetail[],
    isOperational = true,
  ) {
    super(message);

    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    // Auto-derive status code from error code if not provided
    this.statusCode = statusCode ?? getStatusCode(code);

    // Set the prototype explicitly for proper instanceof checks across modules
    Object.setPrototypeOf(this, AppError.prototype);

    // captureStackTrace is Node.js only, skip in browser environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
