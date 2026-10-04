import bcrypt from "bcrypt";
import crypto from "crypto";
import { prisma } from "../config/database.js";
import { env } from "../config/env.js";
import { generateToken } from "../utils/jwt.js";
import { successResponse } from "../utils/apiResponse.js";
import { BadRequestError, UnauthorizedError, NotFoundError } from "../utils/customError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createNotification } from "../services/notificationService.js";

// Memory storage for password reset tokens (preserves database schema from modifications)
const resetTokens = new Map();

/**
 * Register a new user account
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req, res) => {
  const { fullName, email, password, phone, dateOfBirth, gender, role, specialization, hospital } = req.body;

  // 1. Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    throw new BadRequestError("An account with this email address already exists.");
  }

  // 2. Hash password
  const passwordHash = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);

  // 3. Create user in database
  const user = await prisma.user.create({
    data: {
      fullName,
      email: email.toLowerCase(),
      passwordHash,
      phone,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      gender,
      bloodGroup: null,
      height: null,
      weight: null,
      bmi: null,
      allergies: null,
      medicalConditions: null,
      insurance: null,
      lifestyle: null,
      role: role === "doctor" ? "doctor" : "patient",
      specialization: specialization || null,
      hospital: hospital || null,
      isActive: true,
      isVerified: false,
    },
  });

  // 4. In Phase 3, log register activity
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      module: "Auth",
      action: "REGISTER",
      description: "User registered account successfully.",
    },
  });

  // 5. Send welcome notification
  await createNotification(
    user.id,
    "Welcome to RK Health",
    "Welcome to your smart health companion! Schedule an appointment or add medications to receive automated reminders.",
    "System"
  );

  // Omit passwordHash in response
  const { passwordHash: _, ...userWithoutPassword } = user;

  res.status(201).json(
    successResponse("Account created successfully!", userWithoutPassword, 201)
  );
});

/**
 * Login user
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // 1. Find user by email
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  if (!user.isActive) {
    throw new UnauthorizedError("This account is currently deactivated.");
  }

  // 2. Compare password hashes
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new UnauthorizedError("Invalid email or password");
  }

  // 3. Generate access token
  const token = generateToken(user.id);

  // 4. Store login activity log
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      module: "Auth",
      action: "LOGIN",
      description: "User logged in successfully",
    },
  });

  // 5. Configure cookie
  res.cookie("token", token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  const { passwordHash: _, ...userWithoutPassword } = user;

  res.status(200).json(
    successResponse("Login successful", {
      user: userWithoutPassword,
      token,
    })
  );
});

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
  // Clear the cookie token
  res.clearCookie("token");

  res.status(200).json(
    successResponse("Logout successful")
  );
});

/**
 * Generate password reset token
 * POST /api/auth/forgot-password
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // 1. Find user by email
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    throw new NotFoundError("No account found with this email address");
  }

  // 2. Generate secure token
  const resetToken = crypto.randomBytes(32).toString("hex");

  // 3. Hash token and save in memory map (expires in 10 minutes)
  const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  resetTokens.set(hashedToken, {
    userId: user.id,
    expires: Date.now() + 10 * 60 * 1000, // 10 minutes
  });

  res.status(200).json(
    successResponse("Password reset token generated successfully. In Phase 4, this token will be emailed.", {
      resetToken, // Returned in response for testing/development
    })
  );
});

/**
 * Reset password using token
 * POST /api/auth/reset-password
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  // 1. Hash incoming token to match mapped keys
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const storedReset = resetTokens.get(hashedToken);

  if (!storedReset) {
    throw new BadRequestError("Invalid or expired password reset token.");
  }

  if (Date.now() > storedReset.expires) {
    resetTokens.delete(hashedToken);
    throw new BadRequestError("Reset token has expired.");
  }

  // 2. Hash new password
  const passwordHash = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);

  // 3. Update user password
  await prisma.user.update({
    where: { id: storedReset.userId },
    data: { passwordHash },
  });

  // 4. Log activity
  await prisma.activityLog.create({
    data: {
      userId: storedReset.userId,
      module: "Auth",
      action: "RESET_PASSWORD",
      description: "Password reset completed successfully using reset token.",
    },
  });

  // Remove used token
  resetTokens.delete(hashedToken);

  res.status(200).json(
    successResponse("Password has been reset successfully. You can now log in.")
  );
});
