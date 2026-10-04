import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../config/database.js";
import { UnauthorizedError } from "../utils/customError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Protect middleware to secure private endpoints using JWT
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Extract token from Authorization header or Cookies
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // 2. Validate token presence
  if (!token) {
    throw new UnauthorizedError("You are not logged in. Please sign in to access this resource.");
  }

  try {
    // 3. Verify token authenticity
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // 4. Find user corresponding to token
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!currentUser) {
      throw new UnauthorizedError("The user belonging to this token no longer exists.");
    }

    if (!currentUser.isActive) {
      throw new UnauthorizedError("Your account has been deactivated.");
    }

    // 5. Attach user to request payload
    req.user = currentUser;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new UnauthorizedError("Session expired. Please sign in again.");
    }
    throw new UnauthorizedError("Authentication failed. Invalid token.");
  }
});

/**
 * Role authorization guard
 * @param {...string} roles 
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new UnauthorizedError("You do not have permission to perform this action.");
    }
    next();
  };
};
