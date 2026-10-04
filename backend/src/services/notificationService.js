import { prisma } from "../config/database.js";
import { logger } from "../config/logger.js";

/**
 * Creates a system/app notification for the user and writes an activity log audit entry
 * @param {string} userId 
 * @param {string} title 
 * @param {string} message 
 * @param {"Appointment" | "Medication" | "AI" | "Report" | "System"} type 
 * @returns {Promise<object>} notification
 */
export const createNotification = async (userId, title, message, type = "System") => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        isRead: false,
      },
    });

    // Write activity log for audit
    await prisma.activityLog.create({
      data: {
        userId,
        module: "Notification",
        action: "CREATE",
        description: `Notification created: "${title}".`,
      },
    });

    logger.info(`🔔 Notification created for User ${userId}: "${title}"`);
    return notification;
  } catch (err) {
    logger.error("❌ Failed to create notification log:", err);
    return null;
  }
};
