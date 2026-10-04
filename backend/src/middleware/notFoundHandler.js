import { NotFoundError } from "../utils/customError.js";

// Handle requests to routes that do not exist
export const notFoundHandler = (req, res, next) => {
  next(new NotFoundError(`Path ${req.method} ${req.originalUrl} not found`));
};
