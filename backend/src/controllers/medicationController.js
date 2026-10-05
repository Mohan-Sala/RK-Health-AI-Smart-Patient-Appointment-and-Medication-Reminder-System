import { prisma } from "../config/database.js";
import { successResponse } from "../utils/apiResponse.js";
import { NotFoundError, BadRequestError } from "../utils/customError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createNotification } from "../services/notificationService.js";
import { formatToE164, sendSms } from "../services/twilioService.js";
import { logger } from "../config/logger.js";

/**
 * Create a new medication
 * POST /api/medications
 */
export const createMedication = asyncHandler(async (req, res) => {
  const {
    medicineName,
    dosage,
    strength,
    medicineType,
    frequency,
    foodPreference,
    startDate,
    endDate,
    reminderTime,
    phoneNumber,
    reminderEnabled,
    status,
    notes,
    patientId,
    disease,
    prescribedBy: explicitDoctor,
  } = req.body;

  const targetUserId = req.user.role === "doctor" && patientId ? patientId : req.user.id;
  const isDoctor = req.user.role === "doctor";
  const doctorName = isDoctor ? `Dr. ${req.user.fullName}` : (explicitDoctor || null);

  // If no phone number was passed explicitly, inherit the target user's phone
  let targetPhone = phoneNumber;
  if (!targetPhone) {
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { phone: true },
    });
    targetPhone = targetUser?.phone || req.user.phone;
  }
  const finalPhoneNumber = targetPhone ? formatToE164(targetPhone) : null;

  // 1. Create medication in database
  const medication = await prisma.medication.create({
    data: {
      userId: targetUserId,
      medicineName,
      dosage,
      strength,
      medicineType,
      frequency,
      foodPreference,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reminderTime,
      phoneNumber: finalPhoneNumber,
      reminderEnabled: reminderEnabled !== undefined ? reminderEnabled : true,
      status: status || "Pending",
      disease: disease || null,
      prescribedBy: doctorName,
      notes,
    },
  });

  // 2. Generate notification
  if (isDoctor && targetUserId !== req.user.id) {
    await createNotification(
      targetUserId,
      "New Prescription from Doctor",
      `Dr. ${req.user.fullName} has prescribed ${medicineName} (${dosage}) for ${disease || "your condition"}.`,
      "Medication"
    );
  } else {
    await createNotification(
      req.user.id,
      "Medication Added",
      `You have successfully added medication "${medicineName}".`,
      "Medication"
    );
  }

  // 3. Write activity log
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      module: "Medication",
      action: "CREATE",
      description: isDoctor && targetUserId !== req.user.id
        ? `Prescribed medication "${medicineName}" for patient.`
        : `Added new medication "${medicineName}".`,
    },
  });

  // 4. Auto-dispatch SMS to patient if prescribed by doctor
  if (isDoctor && targetUserId !== req.user.id && finalPhoneNumber) {
    try {
      const patientUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { fullName: true },
      });
      const patientFirstName = (patientUser?.fullName || "Patient").split(" ")[0];
      const foodText = foodPreference ? `\nPreference: ${foodPreference}` : "";
      const smsBody = `Hello ${patientFirstName},\nDr. ${req.user.fullName} has prescribed a new medication for you:\n${medicineName} (${dosage})\nTime: ${reminderTime}${foodText}\n- RK Health`;

      const twilioRes = await sendSms(finalPhoneNumber, smsBody);
      if (twilioRes.success) {
        logger.info(`✉️ Prescription SMS sent to ${twilioRes.phone} for medication ${medication.id}`);
        await prisma.activityLog.create({
          data: {
            userId: targetUserId,
            module: "Medication",
            action: "SMS_AUTO_PRESCRIPTION",
            description: `Auto-sent prescription SMS to ${twilioRes.phone} for "${medicineName}".`,
          },
        });
      }
    } catch (smsErr) {
      logger.warn(`⚠️ Failed to dispatch prescription SMS: ${smsErr.message}`);
    }
  }

  res.status(201).json(
    successResponse("Medication created successfully", medication, 201)
  );
});

/**
 * Get medications belonging to the authenticated user
 * GET /api/medications
 */
export const getMedications = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    reminderEnabled,
    medicineType,
    startDate,
    endDate,
    sortBy = "newest",
  } = req.query;

  const parsedPage = parseInt(page, 10);
  const parsedLimit = parseInt(limit, 10);
  const skip = (parsedPage - 1) * parsedLimit;

  // Build filters query
  const where = {};
  if (req.user.role !== "doctor") {
    where.userId = req.user.id;
  } else if (req.query.patientId) {
    where.userId = req.query.patientId;
  }

  // Text search
  if (search) {
    where.OR = [
      { medicineName: { contains: search, mode: "insensitive" } },
      { dosage: { contains: search, mode: "insensitive" } },
      { notes: { contains: search, mode: "insensitive" } },
    ];
  }

  // Exact filters
  if (status) where.status = status;
  if (reminderEnabled !== undefined) where.reminderEnabled = reminderEnabled === "true";
  if (medicineType) where.medicineType = medicineType;

  // Date range filters
  if (startDate || endDate) {
    where.startDate = {};
    if (startDate) where.startDate.gte = new Date(startDate);
    if (endDate) where.startDate.lte = new Date(endDate);
  }

  // Sorting maps
  let orderBy = { createdAt: "desc" };
  if (sortBy === "oldest") orderBy = { createdAt: "asc" };
  else if (sortBy === "medicineName") orderBy = { medicineName: "asc" };
  else if (sortBy === "reminderTime") orderBy = { reminderTime: "asc" };
  else if (sortBy === "startDate") orderBy = { startDate: "asc" };

  // Fetch medications & count total
  const [medications, total] = await Promise.all([
    prisma.medication.findMany({
      where,
      include: {
        user: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
      },
      orderBy,
      skip,
      take: parsedLimit,
    }),
    prisma.medication.count({ where }),
  ]);

  // Dynamically calculate compliance percentage on the fly for each medication
  const medicationsWithCompliance = await Promise.all(
    medications.map(async (med) => {
      const logs = await prisma.reminderHistory.findMany({
        where: { medicationId: med.id },
      });
      const totalLogs = logs.length;
      const takenLogs = logs.filter((l) => l.status === "Taken").length;
      const compliance = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 100;
      return {
        ...med,
        compliance,
      };
    })
  );

  res.status(200).json(
    successResponse("Medications retrieved successfully", {
      medications: medicationsWithCompliance,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit),
      },
    })
  );
});

/**
 * Get a single medication by ID
 * GET /api/medications/:id
 */
export const getMedicationById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const medication = await prisma.medication.findUnique({
    where: { id },
  });

  if (!medication || (medication.userId !== req.user.id && req.user.role !== "doctor")) {
    throw new NotFoundError("Medication not found");
  }

  // Calculate compliance dynamically
  const logs = await prisma.reminderHistory.findMany({
    where: { medicationId: id },
  });
  const totalLogs = logs.length;
  const takenLogs = logs.filter((l) => l.status === "Taken").length;
  const compliance = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 100;

  res.status(200).json(
    successResponse("Medication retrieved successfully", {
      ...medication,
      compliance,
      history: logs,
    })
  );
});

/**
 * Update medication details
 * PUT /api/medications/:id
 */
export const updateMedication = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 1. Ensure medication exists and belongs to user or doctor
  const existing = await prisma.medication.findUnique({
    where: { id },
  });

  if (!existing || (existing.userId !== req.user.id && req.user.role !== "doctor")) {
    throw new NotFoundError("Medication not found");
  }

  // 2. Clean and build safe data for Prisma
  const cleanData = {};
  if (req.body.medicineName !== undefined) cleanData.medicineName = req.body.medicineName;
  if (req.body.dosage !== undefined) cleanData.dosage = req.body.dosage;
  if (req.body.strength !== undefined) cleanData.strength = req.body.strength || null;
  if (req.body.medicineType !== undefined) cleanData.medicineType = req.body.medicineType || null;
  if (req.body.frequency !== undefined) cleanData.frequency = req.body.frequency || null;
  if (req.body.foodPreference !== undefined) cleanData.foodPreference = req.body.foodPreference || null;
  if (req.body.startDate !== undefined && req.body.startDate) cleanData.startDate = new Date(req.body.startDate);
  if (req.body.endDate !== undefined && req.body.endDate) cleanData.endDate = new Date(req.body.endDate);
  if (req.body.reminderTime !== undefined) cleanData.reminderTime = req.body.reminderTime;
  if (req.body.phoneNumber !== undefined) cleanData.phoneNumber = req.body.phoneNumber ? formatToE164(req.body.phoneNumber) : null;
  if (req.body.reminderEnabled !== undefined) cleanData.reminderEnabled = Boolean(req.body.reminderEnabled);
  if (req.body.status !== undefined) cleanData.status = req.body.status;
  if (req.body.disease !== undefined) cleanData.disease = req.body.disease || null;
  if (req.body.notes !== undefined) cleanData.notes = req.body.notes || null;
  if (req.body.prescribedBy !== undefined) cleanData.prescribedBy = req.body.prescribedBy || null;

  // Map patientId to Prisma's userId foreign key if provided by a doctor
  if (req.user.role === "doctor" && req.body.patientId) {
    cleanData.userId = req.body.patientId;
  }

  // 3. Update database
  const medication = await prisma.medication.update({
    where: { id },
    data: cleanData,
    include: {
      user: {
        select: { id: true, fullName: true, email: true, phone: true },
      },
    },
  });

  // 4. Alert patient if doctor modified prescription
  const targetPatientId = cleanData.userId || existing.userId;
  if (req.user.role === "doctor" && targetPatientId !== req.user.id) {
    const isDoseAdjusted = req.body.dosage && req.body.dosage !== existing.dosage;
    let notifTitle = "Prescription Updated by Doctor";
    let notifMessage = `Dr. ${req.user.fullName} updated your prescription for ${medication.medicineName} (${medication.dosage}${medication.disease ? ` for ${medication.disease}` : ""}).`;

    if (isDoseAdjusted) {
      notifTitle = "Medication Dose Adjusted by Doctor";
      const reasonNote = req.body.improvementNote ? ` Note: ${req.body.improvementNote}` : " Reason: Clinical improvement.";
      notifMessage = `Dr. ${req.user.fullName} updated your ${existing.medicineName} dosage from ${existing.dosage} to ${req.body.dosage}.${reasonNote}`;
    }

    await createNotification(
      targetPatientId,
      notifTitle,
      notifMessage,
      "Medication"
    );

    // Auto-dispatch SMS notification to the patient
    const phoneToNotify = medication.phoneNumber || medication.user?.phone;
    if (phoneToNotify) {
      try {
        const patientFirstName = (medication.user?.fullName || "Patient").split(" ")[0];
        const smsBody = isDoseAdjusted
          ? `Hello ${patientFirstName},\nDr. ${req.user.fullName} updated your ${existing.medicineName} dosage to ${req.body.dosage}.${req.body.improvementNote ? ` (${req.body.improvementNote})` : ""}\n- RK Health`
          : `Hello ${patientFirstName},\nDr. ${req.user.fullName} updated your prescription for ${medication.medicineName} (${medication.dosage}).\n- RK Health`;

        const twilioRes = await sendSms(phoneToNotify, smsBody);
        if (twilioRes.success) {
          logger.info(`✉️ Medication update SMS dispatched to ${twilioRes.phone} for medication ${medication.id}`);
        }
      } catch (smsErr) {
        logger.warn(`⚠️ Failed to send medication update SMS: ${smsErr.message}`);
      }
    }
  }

  // 5. Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      module: "Medication",
      action: "UPDATE",
      description: req.user.role === "doctor" && targetPatientId !== req.user.id
        ? `Updated prescription "${medication.medicineName}" for patient.`
        : `Updated medication "${medication.medicineName}" details.`,
    },
  });

  res.status(200).json(
    successResponse("Medication updated successfully", medication)
  );
});

/**
 * Delete a medication
 * DELETE /api/medications/:id
 */
export const deleteMedication = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 1. Ensure medication exists and belongs to user or doctor
  const existing = await prisma.medication.findUnique({
    where: { id },
  });

  if (!existing || (existing.userId !== req.user.id && req.user.role !== "doctor")) {
    throw new NotFoundError("Medication not found");
  }

  // 2. Delete from database (cascades to ReminderHistory)
  await prisma.medication.delete({
    where: { id },
  });

  // 3. Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      module: "Medication",
      action: "DELETE",
      description: `Deleted medication "${existing.medicineName}".`,
    },
  });

  res.status(200).json(
    successResponse("Medication deleted successfully")
  );
});

/**
 * Update medication status (Pending, Taken, Missed, Skipped)
 * PATCH /api/medications/:id/status
 */
export const updateMedicationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // 1. Ensure medication exists and belongs to user
  const existing = await prisma.medication.findUnique({
    where: { id },
  });

  if (!existing || (existing.userId !== req.user.id && req.user.role !== "doctor")) {
    throw new NotFoundError("Medication not found");
  }

  // 2. Update medication status
  const updatedMedication = await prisma.medication.update({
    where: { id },
    data: { status },
  });

  // 3. Store in compliance log history (ReminderHistory)
  const log = await prisma.reminderHistory.create({
    data: {
      medicationId: id,
      reminderType: "Push",
      status: status, // Taken, Missed, Skipped
      deliveryProvider: "LocalPush",
      deliveryTime: new Date(),
      response: `Status changed to ${status}`,
    },
  });

  // 4. Log specific Activity Log action
  const actionMap = {
    Taken: "TAKEN",
    Missed: "MISSED",
    Skipped: "SKIPPED",
    Pending: "UPDATE_STATUS",
  };

  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      module: "Medication",
      action: actionMap[status] || "UPDATE_STATUS",
      description: `Marked medication "${existing.medicineName}" as ${status}.`,
    },
  });

  // 5. Calculate updated compliance
  const logs = await prisma.reminderHistory.findMany({
    where: { medicationId: id },
  });
  const totalLogs = logs.length;
  const takenLogs = logs.filter((l) => l.status === "Taken").length;
  const compliance = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 100;

  res.status(200).json(
    successResponse(`Medication status updated to ${status}`, {
      medication: updatedMedication,
      compliance,
      historyLog: log,
    })
  );
});

/**
 * Recalculate/Get medication compliance statistics
 * PATCH /api/medications/:id/compliance
 */
export const updateCompliance = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.medication.findUnique({
    where: { id },
  });

  if (!existing || (existing.userId !== req.user.id && req.user.role !== "doctor")) {
    throw new NotFoundError("Medication not found");
  }

  // Fetch compliance history logs
  const logs = await prisma.reminderHistory.findMany({
    where: { medicationId: id },
  });

  const totalLogs = logs.length;
  const takenLogs = logs.filter((l) => l.status === "Taken").length;
  const compliance = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 100;

  res.status(200).json(
    successResponse("Compliance calculated successfully", {
      medicationId: id,
      medicineName: existing.medicineName,
      compliance,
      totalRemindersLogged: totalLogs,
      takenCount: takenLogs,
      history: logs,
    })
  );
});
