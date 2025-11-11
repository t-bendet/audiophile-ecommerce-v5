class AppError extends Error {
  statusCode;
  status: "fail" | "error";
  isOperational;
  constructor(message: string, statusCode: number = 500) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
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
