import { prisma } from "../config/database.js";
import { generateSummaryFromNotes } from "../services/aiService.js";
import { successResponse } from "../utils/apiResponse.js";
import { NotFoundError, BadRequestError } from "../utils/customError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createNotification } from "../services/notificationService.js";

/**
 * Generate a new AI Healthcare Summary for an appointment
 * POST /api/ai/generate-summary
 */
export const generateSummary = asyncHandler(async (req, res) => {
  const { appointmentId } = req.body;

  // 1. Verify appointment exists
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      user: true,
    },
  });

  const isDoctor = req.user.role === "doctor";

  if (!appointment || (!isDoctor && appointment.userId !== req.user.id)) {
    throw new NotFoundError("Appointment not found");
  }

  // 2. Fetch target patient details and patient medications to include in context
  const targetPatientId = appointment.userId;
  const targetPatient = appointment.user || (await prisma.user.findUnique({ where: { id: targetPatientId } }));

  const medications = await prisma.medication.findMany({
    where: { userId: targetPatientId },
  });

  // 3. Call AI service with role indicator
  const aiResult = await generateSummaryFromNotes(
    appointment,
    targetPatient || req.user,
    medications,
    isDoctor
  );

  // 4. Save or update summary in database
  const aiSummary = await prisma.aiSummary.upsert({
    where: { appointmentId },
    update: {
      visitOverview: aiResult.content.visitOverview,
      medicalExplanation: aiResult.content.patientExplanation,
      medicationInstructions: aiResult.content.medicationGuidance,
      followUpAdvice: aiResult.content.followUpAdvice,
      recommendations: `${aiResult.content.healthRecommendations}\n\nPrecautions:\n${aiResult.content.precautions}`,
      summary: aiResult.content.summary,
      generatedBy: `${aiResult.metadata.modelName} (Prompt v${aiResult.metadata.promptVersion})`,
      generatedAt: new Date(),
    },
    create: {
      appointmentId,
      visitOverview: aiResult.content.visitOverview,
      medicalExplanation: aiResult.content.patientExplanation,
      medicationInstructions: aiResult.content.medicationGuidance,
      followUpAdvice: aiResult.content.followUpAdvice,
      recommendations: `${aiResult.content.healthRecommendations}\n\nPrecautions:\n${aiResult.content.precautions}`,
      summary: aiResult.content.summary,
      generatedBy: `${aiResult.metadata.modelName} (Prompt v${aiResult.metadata.promptVersion})`,
    },
  });

  // 5. Generate notifications
  if (isDoctor && targetPatientId !== req.user.id) {
    // Notify the patient that their doctor prepared an AI consultation summary
    await createNotification(
      targetPatientId,
      "Doctor Generated AI Consultation Summary",
      `Dr. ${req.user.fullName} generated an AI consultation summary for your visit "${appointment.title}".`,
      "AI"
    );
    // Notify doctor of successful generation
    await createNotification(
      req.user.id,
      "AI Summary Generated",
      `AI Clinical Summary generated for patient ${appointment.patientName} (${appointment.title}).`,
      "AI"
    );
  } else {
    await createNotification(
      req.user.id,
      "AI Summary Generated",
      `AI Healthcare Summary is now available for appointment "${appointment.title}".`,
      "AI"
    );
  }

  // 6. Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      module: "AI Summary",
      action: "GENERATE",
      description: isDoctor && targetPatientId !== req.user.id
        ? `Generated AI Clinical Summary for patient ${appointment.patientName} ("${appointment.title}").`
        : `Generated AI Healthcare Summary for appointment "${appointment.title}".`,
    },
  });

  res.status(201).json(
    successResponse("AI summary generated successfully", aiSummary, 201)
  );
});

/**
 * List previous AI summaries for the authenticated user
 * GET /api/ai/summaries
 */
export const getSummaries = asyncHandler(async (req, res) => {
  const isDoctor = req.user.role === "doctor";

  const summaries = await prisma.aiSummary.findMany({
    where: isDoctor ? {} : {
      appointment: { userId: req.user.id },
    },
    include: {
      appointment: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      generatedAt: "desc",
    },
  });

  res.status(200).json(
    successResponse("AI summaries retrieved successfully", summaries)
  );
});

/**
 * Get detailed view of an AI summary by ID
 * GET /api/ai/summaries/:id
 */
export const getSummaryById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isDoctor = req.user.role === "doctor";

  const summary = await prisma.aiSummary.findUnique({
    where: { id },
    include: {
      appointment: {
        include: { user: true },
      },
    },
  });

  if (!summary || (!isDoctor && summary.appointment.userId !== req.user.id)) {
    throw new NotFoundError("AI summary not found");
  }

  res.status(200).json(
    successResponse("AI summary retrieved successfully", summary)
  );
});

/**
 * Regenerate an existing AI summary
 * PUT /api/ai/summaries/:id/regenerate
 */
export const regenerateSummary = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isDoctor = req.user.role === "doctor";

  // 1. Ensure summary exists and belongs to user or doctor
  const existingSummary = await prisma.aiSummary.findUnique({
    where: { id },
    include: {
      appointment: {
        include: { user: true },
      },
    },
  });

  if (!existingSummary || (!isDoctor && existingSummary.appointment.userId !== req.user.id)) {
    throw new NotFoundError("AI summary not found");
  }

  const targetPatientId = existingSummary.appointment.userId;
  const targetPatient = existingSummary.appointment.user || (await prisma.user.findUnique({ where: { id: targetPatientId } }));

  // 2. Fetch patient medications
  const medications = await prisma.medication.findMany({
    where: { userId: targetPatientId },
  });

  // 3. Call AI service
  const aiResult = await generateSummaryFromNotes(
    existingSummary.appointment,
    targetPatient || req.user,
    medications,
    isDoctor
  );

  // 4. Update summary in database
  const updatedSummary = await prisma.aiSummary.update({
    where: { id },
    data: {
      visitOverview: aiResult.content.visitOverview,
      medicalExplanation: aiResult.content.patientExplanation,
      medicationInstructions: aiResult.content.medicationGuidance,
      followUpAdvice: aiResult.content.followUpAdvice,
      recommendations: `${aiResult.content.healthRecommendations}\n\nPrecautions:\n${aiResult.content.precautions}`,
      summary: aiResult.content.summary,
      generatedBy: `${aiResult.metadata.modelName} (Prompt v${aiResult.metadata.promptVersion})`,
      generatedAt: new Date(),
    },
  });

  // 5. Generate notifications
  if (isDoctor && targetPatientId !== req.user.id) {
    await createNotification(
      targetPatientId,
      "Doctor Updated AI Consultation Summary",
      `Dr. ${req.user.fullName} updated the AI consultation summary for your visit "${existingSummary.appointment.title}".`,
      "AI"
    );
    await createNotification(
      req.user.id,
      "AI Summary Regenerated",
      `AI Clinical Summary regenerated for patient ${existingSummary.appointment.patientName}.`,
      "AI"
    );
  } else {
    await createNotification(
      req.user.id,
      "AI Summary Regenerated",
      `AI Healthcare Summary was successfully updated for appointment "${existingSummary.appointment.title}".`,
      "AI"
    );
  }

  // 6. Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      module: "AI Summary",
      action: "REGENERATE",
      description: isDoctor && targetPatientId !== req.user.id
        ? `Regenerated AI Clinical Summary for patient ${existingSummary.appointment.patientName} ("${existingSummary.appointment.title}").`
        : `Regenerated AI Healthcare Summary for appointment "${existingSummary.appointment.title}".`,
    },
  });

  res.status(200).json(
    successResponse("AI summary regenerated successfully", updatedSummary)
  );
});

/**
 * Delete an AI summary
 * DELETE /api/ai/summaries/:id
 */
export const deleteSummary = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isDoctor = req.user.role === "doctor";

  // 1. Ensure summary exists and belongs to user or doctor
  const existingSummary = await prisma.aiSummary.findUnique({
    where: { id },
    include: { appointment: true },
  });

  if (!existingSummary || (!isDoctor && existingSummary.appointment.userId !== req.user.id)) {
    throw new NotFoundError("AI summary not found");
  }

  // 2. Delete from database
  await prisma.aiSummary.delete({
    where: { id },
  });

  // 3. Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      module: "AI Summary",
      action: "DELETE",
      description: `Deleted AI Healthcare Summary for appointment "${existingSummary.appointment.title}".`,
    },
  });

  res.status(200).json(
    successResponse("AI summary deleted successfully")
  );
});

/**
 * Get compiled printable healthcare report data for the summary
 * GET /api/ai/summaries/:id/report
 */
export const getReportData = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isDoctor = req.user.role === "doctor";

  // Fetch summary and associated appointment
  const summary = await prisma.aiSummary.findUnique({
    where: { id },
    include: {
      appointment: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!summary || (!isDoctor && summary.appointment.userId !== req.user.id)) {
    throw new NotFoundError("AI summary not found");
  }

  const patient = summary.appointment.user || req.user;
  const targetPatientId = summary.appointment.userId;

  // Fetch medications for report context
  const medications = await prisma.medication.findMany({
    where: { userId: targetPatientId },
  });

  res.status(200).json(
    successResponse("Printable report data compiled successfully", {
      patientInformation: {
        fullName: patient.fullName || summary.appointment.patientName,
        email: patient.email,
        phone: patient.phone,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        bloodGroup: patient.bloodGroup,
        allergies: patient.allergies,
        medicalConditions: patient.medicalConditions,
      },
      appointmentDetails: {
        doctorName: summary.appointment.doctorName,
        title: summary.appointment.title,
        hospital: summary.appointment.hospital,
        specialization: summary.appointment.specialization,
        appointmentDate: summary.appointment.appointmentDate,
        appointmentTime: summary.appointment.appointmentTime,
        visitType: summary.appointment.visitType,
      },
      aiVisitSummary: {
        visitOverview: summary.visitOverview,
        patientExplanation: summary.medicalExplanation,
        medicationGuidance: summary.medicationInstructions,
        recommendations: summary.recommendations,
        followUpAdvice: summary.followUpAdvice,
        healthSummary: summary.summary,
      },
      medicationGuidance: medications,
      reportTimestamp: new Date().toISOString(),
    })
  );
});
