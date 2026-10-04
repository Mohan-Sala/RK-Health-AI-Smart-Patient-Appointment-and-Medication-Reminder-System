export class CustomError extends Error {
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.success = false;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends CustomError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

export class BadRequestError extends CustomError {
  constructor(message = "Bad request", errors = null) {
    super(message, 400, errors);
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message = "Unauthorized access") {
    super(message, 401);
  }
}

export class ForbiddenError extends CustomError {
  constructor(message = "Forbidden access") {
    super(message, 403);
  }
}

export class InternalServerError extends CustomError {
  constructor(message = "Internal server error") {
    super(message, 500);
  }
}
