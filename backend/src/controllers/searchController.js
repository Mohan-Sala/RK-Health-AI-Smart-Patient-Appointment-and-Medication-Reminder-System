import { prisma } from "../config/database.js";
import { successResponse } from "../utils/apiResponse.js";
import { BadRequestError } from "../utils/customError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Execute unified global search across database tables
 * GET /api/search
 */
export const executeGlobalSearch = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { q, startDate, endDate } = req.query;

  if (!q) {
    throw new BadRequestError("A search query parameter (q) is required.");
  }

  // Create date constraint if provided
  const dateFilter = {};
  if (startDate || endDate) {
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
  }

  const hasDateRange = Object.keys(dateFilter).length > 0;

  // Run case-insensitive matching queries in parallel
  const [
    appointments,
    medications,
    aiSummaries,
    reports,
    activityLogs,
    notifications,
  ] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        userId,
        OR: [
          { doctorName: { contains: q, mode: "insensitive" } },
          { title: { contains: q, mode: "insensitive" } },
          { hospital: { contains: q, mode: "insensitive" } },
          { specialization: { contains: q, mode: "insensitive" } },
        ],
        appointmentDate: hasDateRange ? dateFilter : undefined,
      },
      take: 10,
    }),
    prisma.medication.findMany({
      where: {
        userId,
        OR: [
          { medicineName: { contains: q, mode: "insensitive" } },
          { notes: { contains: q, mode: "insensitive" } },
        ],
        startDate: hasDateRange ? dateFilter : undefined,
      },
      take: 10,
    }),
    prisma.aiSummary.findMany({
      where: {
        appointment: { userId },
        OR: [
          { summary: { contains: q, mode: "insensitive" } },
          { visitOverview: { contains: q, mode: "insensitive" } },
          { medicalExplanation: { contains: q, mode: "insensitive" } },
        ],
        generatedAt: hasDateRange ? dateFilter : undefined,
      },
      take: 10,
    }),
    prisma.report.findMany({
      where: {
        userId,
        title: { contains: q, mode: "insensitive" },
        createdAt: hasDateRange ? dateFilter : undefined,
      },
      take: 10,
    }),
    prisma.activityLog.findMany({
      where: {
        userId,
        OR: [
          { description: { contains: q, mode: "insensitive" } },
          { module: { contains: q, mode: "insensitive" } },
          { action: { contains: q, mode: "insensitive" } },
        ],
        createdAt: hasDateRange ? dateFilter : undefined,
      },
      take: 10,
    }),
    prisma.notification.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { message: { contains: q, mode: "insensitive" } },
        ],
        createdAt: hasDateRange ? dateFilter : undefined,
      },
      take: 10,
    }),
  ]);

  res.status(200).json(
    successResponse("Unified global search completed", {
      appointments,
      medications,
      aiSummaries,
      reports,
      activityLogs,
      notifications,
    })
  );
});
