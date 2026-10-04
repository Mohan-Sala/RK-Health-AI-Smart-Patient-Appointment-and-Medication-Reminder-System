import { CustomError } from "../utils/customError.js";
import { logger } from "../config/logger.js";
import { errorResponse } from "../utils/apiResponse.js";

// Global error handler middleware
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errors = err.errors || null;

  // If it's not our CustomError, log full stack trace
  if (!(err instanceof CustomError)) {
    logger.error(`💥 Unexpected Error: ${err.message}`, err.stack);
    statusCode = 500;
    message = "An unexpected error occurred on our server.";
  } else {
    logger.warn(`⚠️ Custom Error (${statusCode}): ${message}`);
  }

  res.status(statusCode).json(errorResponse(message, errors, statusCode));
};
