import bcrypt from "bcrypt";
import { prisma } from "../config/database.js";
import { env } from "../config/env.js";
import { successResponse } from "../utils/apiResponse.js";
import { BadRequestError, UnauthorizedError } from "../utils/customError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Get profile details for authenticated user
 * GET /api/users/profile
 */
export const getProfile = asyncHandler(async (req, res) => {
  // Password hash is omitted by protecting middleware or manually
  const { passwordHash: _, ...userWithoutPassword } = req.user;

  res.status(200).json(
    successResponse("Profile retrieved successfully", userWithoutPassword)
  );
});

/**
 * Update profile details for authenticated user
 * PUT /api/users/profile
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const allowedUpdates = [
    "fullName",
    "phone",
    "dateOfBirth",
    "gender",
    "profileImage",
    "bloodGroup",
    "height",
    "weight",
    "bmi",
    "lifestyle",
    "allergies",
    "medicalConditions",
    "insurance",
    "emergencyContactName",
    "emergencyContactPhone",
    "specialization",
    "hospital",
    "availability"
  ];

  const updateData = {};
  for (const key of allowedUpdates) {
    if (req.body[key] !== undefined) {
      if (key === "dateOfBirth" && req.body[key]) {
        updateData[key] = new Date(req.body[key]);
      } else {
        updateData[key] = req.body[key];
      }
    }
  }

  // Update user in PostgreSQL database
  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: updateData,
  });

  // Log profile update activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      module: "User",
      action: "UPDATE_PROFILE",
      description: "User updated profile information details.",
    },
  });

  const { passwordHash: _, ...userWithoutPassword } = updatedUser;

  res.status(200).json(
    successResponse("Profile updated successfully", userWithoutPassword)
  );
});

/**
 * Update password for authenticated user
 * PUT /api/users/change-password
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // 1. Verify current password
  const isMatch = await bcrypt.compare(currentPassword, req.user.passwordHash);
  if (!isMatch) {
    throw new UnauthorizedError("Incorrect current password.");
  }

  // 2. Hash new password
  const passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_SALT_ROUNDS);

  // 3. Save new password hash
  await prisma.user.update({
    where: { id: req.user.id },
    data: { passwordHash },
  });

  // 4. Log change password activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      module: "User",
      action: "CHANGE_PASSWORD",
      description: "User changed their password successfully.",
    },
  });

  res.status(200).json(
    successResponse("Password updated successfully.")
  );
});

/**
 * Get list of registered patients
 * GET /api/users/patients
 */
export const getPatients = asyncHandler(async (req, res) => {
  const patients = await prisma.user.findMany({
    where: { role: "patient" },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      gender: true,
      dateOfBirth: true,
      bloodGroup: true,
      medicalConditions: true,
      allergies: true,
    },
    orderBy: { fullName: "asc" },
  });

  res.status(200).json(
    successResponse("Patients retrieved successfully", patients)
  );
});

/**
 * Get list of registered doctors
 * GET /api/users/doctors
 */
export const getDoctors = asyncHandler(async (req, res) => {
  const doctors = await prisma.user.findMany({
    where: { role: "doctor" },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      gender: true,
      specialization: true,
      hospital: true,
      availability: true,
    },
    orderBy: { fullName: "asc" },
  });

  res.status(200).json(
    successResponse("Doctors retrieved successfully", doctors)
  );
});
