import fs from "fs";
import path from "path";
import { prisma } from "../config/database.js";
import { successResponse } from "../utils/apiResponse.js";
import { NotFoundError, BadRequestError } from "../utils/customError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { formatToE164 } from "../services/twilioService.js";

/**
 * Get user profile details
 * GET /api/profile
 */
export const getProfile = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      dateOfBirth: true,
      gender: true,
      profileImage: true,
      bloodGroup: true,
      height: true,
      weight: true,
      bmi: true,
      allergies: true,
      medicalConditions: true,
      insuranceProvider: true,
      insurance: true,
      lifestyle: true,
      emergencyContactName: true,
      emergencyContactPhone: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  res.status(200).json(
    successResponse("Profile retrieved successfully", user)
  );
});

/**
 * Update user profile details
 * PUT /api/profile
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const {
    fullName,
    phone,
    dateOfBirth,
    gender,
    bloodGroup,
    height,
    weight,
    bmi,
    allergies,
    medicalConditions,
    insurance,
    lifestyle,
    emergencyContactName,
    emergencyContactPhone,
    specialization,
    hospital,
    availability,
  } = req.body;

  const cleanValue = (val) => {
    if (val === undefined) return undefined;
    if (val === null || String(val).trim() === "") return null;
    return val;
  };

  const formattedPhone = phone !== undefined ? (phone ? formatToE164(phone) : null) : undefined;

  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      fullName,
      phone: formattedPhone,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : (dateOfBirth === null ? null : undefined),
      gender: cleanValue(gender),
      bloodGroup: cleanValue(bloodGroup),
      height: cleanValue(height) !== null ? String(cleanValue(height)) : null,
      weight: cleanValue(weight) !== null ? String(cleanValue(weight)) : null,
      bmi: cleanValue(bmi) !== null ? Number(cleanValue(bmi)) : null,
      allergies: cleanValue(allergies),
      medicalConditions: cleanValue(medicalConditions),
      insurance: cleanValue(insurance),
      lifestyle: cleanValue(lifestyle),
      emergencyContactName: cleanValue(emergencyContactName),
      emergencyContactPhone: emergencyContactPhone ? formatToE164(emergencyContactPhone) : (emergencyContactPhone === null ? null : undefined),
      specialization: cleanValue(specialization),
      hospital: cleanValue(hospital),
      availability: cleanValue(availability),
    },
  });

  // Automatically propagate updated mobile number to all user medications for synchronized SMS reminders
  if (formattedPhone) {
    await prisma.medication.updateMany({
      where: { userId: req.user.id },
      data: { phoneNumber: formattedPhone },
    });
  }

  // Log activity audit
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      module: "User",
      action: "PROFILE_UPDATE",
      description: formattedPhone
        ? `Updated profile details and mobile number to ${formattedPhone}.`
        : "Updated user profile details.",
    },
  });

  res.status(200).json(
    successResponse("Profile updated successfully", updatedUser)
  );
});

/**
 * Upload profile avatar image
 * PUT /api/profile/avatar
 */
export const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new BadRequestError("No image file uploaded.");
  }

  const relativePath = `/uploads/avatars/${req.file.filename}`;

  // Update profileImage in database
  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: { profileImage: relativePath },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      module: "User",
      action: "PROFILE_UPDATE",
      description: "Uploaded new profile avatar image.",
    },
  });

  res.status(200).json(
    successResponse("Profile picture updated successfully", {
      profileImage: relativePath,
    })
  );
});

/**
 * Delete profile avatar image
 * DELETE /api/profile/avatar
 */
export const deleteAvatar = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
  });

  if (!user || !user.profileImage) {
    throw new BadRequestError("No profile avatar image currently set.");
  }

  // Remove the physical file if it exists
  const absolutePath = path.resolve(user.profileImage.replace(/^\//, ""));
  if (fs.existsSync(absolutePath)) {
    try {
      fs.unlinkSync(absolutePath);
    } catch (err) {
      // Log error but proceed to reset db
    }
  }

  // Reset database field
  await prisma.user.update({
    where: { id: req.user.id },
    data: { profileImage: null },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      module: "User",
      action: "PROFILE_UPDATE",
      description: "Removed profile avatar image.",
    },
  });

  res.status(200).json(
    successResponse("Profile picture deleted successfully")
  );
});
