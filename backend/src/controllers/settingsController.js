import { getUserSettings, updateUserSettings } from "../services/settingsService.js";
import { prisma } from "../config/database.js";
import { successResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { formatToE164 } from "../services/twilioService.js";

/**
 * Get user configuration preferences
 * GET /api/settings
 */
export const getSettings = asyncHandler(async (req, res) => {
  const settings = await getUserSettings(req.user.id);
  res.status(200).json(
    successResponse("User settings retrieved successfully", settings)
  );
});

/**
 * Update user configuration preferences
 * PUT /api/settings
 */
export const updateSettings = asyncHandler(async (req, res) => {
  const { phone, phoneNumber, ...otherFields } = req.body;
  const rawPhone = phone || phoneNumber;
  let updatedUser = null;

  if (rawPhone !== undefined) {
    const formattedPhone = rawPhone ? formatToE164(rawPhone) : null;
    updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { phone: formattedPhone },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    if (formattedPhone) {
      await prisma.medication.updateMany({
        where: { userId: req.user.id },
        data: { phoneNumber: formattedPhone },
      });
    }
  }

  const updatedSettings = await updateUserSettings(req.user.id, {
    ...otherFields,
    ...(rawPhone ? { phone: formatToE164(rawPhone) } : {}),
  });

  // Log activity audit
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      module: "User",
      action: "SETTINGS_UPDATE",
      description: rawPhone
        ? `Updated mobile number to ${formatToE164(rawPhone)} and synchronized across settings.`
        : "Updated user preferences and notification settings.",
    },
  });

  res.status(200).json(
    successResponse("User settings updated successfully", {
      ...updatedSettings,
      user: updatedUser,
    })
  );
});
