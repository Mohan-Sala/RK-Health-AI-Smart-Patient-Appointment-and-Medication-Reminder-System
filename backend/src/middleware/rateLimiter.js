import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";
import { errorResponse } from "../utils/apiResponse.js";
import { HTTP_STATUS } from "../utils/constants.js";

// Standard rate limiter for global API protection
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  // Higher threshold (2,000 reqs per 15 min) in production; high volume buffer in development
  limit: env.NODE_ENV === "production" ? 2000 : 10000,
  // Bypass rate limiting entirely during development / testing or for healthchecks
  skip: (req) => {
    if (env.NODE_ENV !== "production") return true;
    if (req.path === "/health" || req.path === "/api/health") return true;
    return false;
  },
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again after 15 minutes",
  handler: (req, res, next, options) => {
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json(
      errorResponse(options.message, null, HTTP_STATUS.TOO_MANY_REQUESTS)
    );
  },
});

