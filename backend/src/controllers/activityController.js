import { prisma } from "../config/database.js";
import { successResponse } from "../utils/apiResponse.js";
import { NotFoundError } from "../utils/customError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Retrieve user's activity log timeline
 * GET /api/activity
 */
export const getActivityLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, module } = req.query;

  const parsedPage = parseInt(page, 10);
  const parsedLimit = parseInt(limit, 10);
  const skip = (parsedPage - 1) * parsedLimit;

  const where = {
    userId: req.user.id,
  };

  if (module) {
    where.module = module;
  }

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: parsedLimit,
    }),
    prisma.activityLog.count({ where }),
  ]);

  res.status(200).json(
    successResponse("Activity logs retrieved successfully", {
      logs,
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
 * Get detailed view of an activity log by ID
 * GET /api/activity/:id
 */
export const getActivityLogById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const log = await prisma.activityLog.findUnique({
    where: { id },
  });

  if (!log || log.userId !== req.user.id) {
    throw new NotFoundError("Activity log not found.");
  }

  res.status(200).json(
    successResponse("Activity log details retrieved", log)
  );
});

/**
 * Clear/delete a single activity log entry
 * DELETE /api/activity/:id
 */
export const deleteActivityLog = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.activityLog.findUnique({
    where: { id },
  });

  if (!existing || existing.userId !== req.user.id) {
    throw new NotFoundError("Activity log not found.");
  }

  await prisma.activityLog.delete({
    where: { id },
  });

  res.status(200).json(
    successResponse("Activity log deleted successfully")
  );
});
