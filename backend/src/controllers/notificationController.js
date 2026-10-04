import { prisma } from "../config/database.js";
import { successResponse } from "../utils/apiResponse.js";
import { NotFoundError } from "../utils/customError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createNotification } from "../services/notificationService.js";

/**
 * Manually trigger/send a system notification
 * POST /api/notifications/send
 */
export const sendSystemNotification = asyncHandler(async (req, res) => {
  const { title, message, type } = req.body;

  const notification = await createNotification(
    req.user.id,
    title || "System Notification",
    message || "No message body provided.",
    type || "System"
  );

  res.status(201).json(
    successResponse("Notification created successfully", notification, 201)
  );
});

/**
 * Get user's notifications (with searching and filtering)
 * GET /api/notifications
 */
export const getNotifications = asyncHandler(async (req, res) => {
  const { search, status, type, startDate, endDate } = req.query;

  const where = {
    userId: req.user.id,
  };

  // Searching by title
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { message: { contains: search, mode: "insensitive" } },
    ];
  }

  // Filters
  if (status === "Read") where.isRead = true;
  if (status === "Unread") where.isRead = false;

  if (type) {
    where.type = type;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json(
    successResponse("Notifications retrieved successfully", notifications)
  );
});

/**
 * Get notification details by ID
 * GET /api/notifications/:id
 */
export const getNotificationById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await prisma.notification.findUnique({
    where: { id },
  });

  if (!notification || notification.userId !== req.user.id) {
    throw new NotFoundError("Notification not found");
  }

  res.status(200).json(
    successResponse("Notification details retrieved", notification)
  );
});

/**
 * Mark a notification as read
 * PATCH /api/notifications/:id/read
 */
export const markNotificationRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 1. Ensure notification exists and belongs to user
  const existing = await prisma.notification.findUnique({
    where: { id },
  });

  if (!existing || existing.userId !== req.user.id) {
    throw new NotFoundError("Notification not found");
  }

  // 2. Mark as read
  const updated = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  // 3. Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      module: "Notification",
      action: "READ",
      description: `Notification marked as read: "${existing.title}".`,
    },
  });

  res.status(200).json(
    successResponse("Notification marked as read successfully", updated)
  );
});

/**
 * Mark all notifications as read
 * PATCH /api/notifications/read-all
 */
export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: {
      userId: req.user.id,
      isRead: false,
    },
    data: { isRead: true },
  });

  res.status(200).json(
    successResponse("All notifications marked as read successfully")
  );
});

/**
 * Delete a notification
 * DELETE /api/notifications/:id
 */
export const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 1. Ensure notification exists and belongs to user
  const existing = await prisma.notification.findUnique({
    where: { id },
  });

  if (!existing || existing.userId !== req.user.id) {
    throw new NotFoundError("Notification not found");
  }

  // 2. Delete notification
  await prisma.notification.delete({
    where: { id },
  });

  // 3. Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      module: "Notification",
      action: "DELETE",
      description: `Deleted notification: "${existing.title}".`,
    },
  });

  res.status(200).json(
    successResponse("Notification deleted successfully")
  );
});
