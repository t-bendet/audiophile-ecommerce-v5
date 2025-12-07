import { ErrorCode, getStatusCode } from "@repo/domain";

class AppError extends Error {
  statusCode;
  code: string;
  isOperational;

  constructor(message: string, code: ErrorCode, statusCode?: number) {
    super(message);

    this.code = code;
    // Auto-derive status code from error code if not provided
    this.statusCode = statusCode ?? getStatusCode(code);
    // isOperational is used to distinguish between operational errors (like validation errors) and programming errors (like syntax errors)don't leak error details
    // Operational errors are expected errors that can be handled gracefully
    this.isOperational = true;
    // uncomment this line to get the name of the error class in the stack trace
    // This line is commented out because it can cause issues with stack traces in some environments
    // this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
