import cron from "node-cron";
import dayjs from "dayjs";
import { prisma } from "../config/database.js";
import { sendSms } from "../services/twilioService.js";
import { createNotification } from "../services/notificationService.js";
import { logger } from "../config/logger.js";

/**
 * Check and deliver medication SMS reminders
 */
const checkMedicationReminders = async () => {
  const currentTimeString = dayjs().format("HH:mm");
  const todayDate = new Date();

  try {
    // Find all medications active today with reminder time matching current time
    const activeMedications = await prisma.medication.findMany({
      where: {
        reminderEnabled: true,
        startDate: { lte: todayDate },
        endDate: { gte: todayDate },
        reminderTime: currentTimeString,
      },
      include: {
        user: true,
      },
    });

    if (activeMedications.length === 0) return;

    logger.info(`⏰ Processing ${activeMedications.length} medication reminder(s) for time: ${currentTimeString}`);

    for (const med of activeMedications) {
      const targetPhone = med.phoneNumber || med.user?.phone;
      if (!targetPhone) continue;

      // Prevent duplicate sends within the current hour
      const startOfHour = dayjs().startOf("hour").toDate();
      const endOfHour = dayjs().endOf("hour").toDate();

      const duplicate = await prisma.reminderHistory.findFirst({
        where: {
          medicationId: med.id,
          reminderType: "SMS",
          deliveryTime: {
            gte: startOfHour,
            lte: endOfHour,
          },
        },
      });

      if (duplicate) {
        logger.info(`⏭️ Duplicate medication reminder skipped for ${med.medicineName} (User ${med.userId})`);
        continue;
      }

      // Format message body
      const body = `Hello ${med.user.fullName.split(" ")[0]},\nThis is your RK Health reminder.\nPlease take:\n${med.medicineName} (${med.dosage})\nTime: ${med.reminderTime}\nStay healthy.`;

      // Dispatch SMS via Twilio
      const twilioResult = await sendSms(targetPhone, body);

      // Save to ReminderHistory
      await prisma.reminderHistory.create({
        data: {
          medicationId: med.id,
          reminderType: "SMS",
          status: twilioResult.success ? "Sent" : "Failed",
          deliveryProvider: "Twilio",
          deliveryTime: new Date(),
          response: twilioResult.success ? `SMS SID: ${twilioResult.sid}` : twilioResult.error,
        },
      });

      // Send app notification
      await createNotification(
        med.userId,
        "Medication Reminder Sent",
        `Medication reminder SMS dispatched for "${med.medicineName}".`,
        "Medication"
      );

      // Log activity audit
      await prisma.activityLog.create({
        data: {
          userId: med.userId,
          module: "Medication",
          action: twilioResult.success ? "SMS_SENT" : "SMS_FAILED",
          description: twilioResult.success
            ? `Auto-sent SMS reminder for medication "${med.medicineName}".`
            : `Failed auto-sending SMS reminder for medication "${med.medicineName}": ${twilioResult.error}`,
        },
      });
    }
  } catch (err) {
    logger.error("❌ Error in checkMedicationReminders cron job:", err);
  }
};

/**
 * Check and deliver appointment SMS reminders
 */
const checkAppointmentReminders = async () => {
  const tomorrowStart = dayjs().add(1, "day").startOf("day").toDate();
  const tomorrowEnd = dayjs().add(1, "day").endOf("day").toDate();

  try {
    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        status: "Upcoming",
        appointmentDate: {
          gte: tomorrowStart,
          lte: tomorrowEnd,
        },
      },
      include: {
        user: true,
      },
    });

    for (const appt of upcomingAppointments) {
      const recipientPhone = appt.user.phone;
      if (!recipientPhone) continue;

      // Prevent duplicate reminder sends
      const duplicate = await prisma.notification.findFirst({
        where: {
          userId: appt.userId,
          title: "Appointment Reminder Sent",
          message: { contains: appt.title },
        },
      });

      if (duplicate) {
        logger.debug(`⏭️ Duplicate appointment reminder skipped for "${appt.title}" (User ${appt.userId})`);
        continue;
      }

      // Format body
      const dateStr = dayjs(appt.appointmentDate).format("YYYY-MM-DD");
      const body = `Hello ${appt.user.fullName.split(" ")[0]},\nYou have an appointment scheduled with ${appt.doctorName} at ${appt.hospital || "clinic"} on ${dateStr} at ${appt.appointmentTime}.\nTitle: ${appt.title}`;

      // Call Twilio
      const twilioResult = await sendSms(recipientPhone, body);

      // Create app notification
      await createNotification(
        appt.userId,
        "Appointment Reminder Sent",
        `Appointment reminder SMS dispatched for "${appt.title}".`,
        "Appointment"
      );

      // Log activity audit
      await prisma.activityLog.create({
        data: {
          userId: appt.userId,
          module: "Appointment",
          action: twilioResult.success ? "SMS_SENT" : "SMS_FAILED",
          description: twilioResult.success
            ? `Auto-sent SMS reminder for appointment "${appt.title}".`
            : `Failed auto-sending SMS reminder for appointment "${appt.title}": ${twilioResult.error}`,
        },
      });
    }
  } catch (err) {
    logger.error("❌ Error in checkAppointmentReminders cron job:", err);
  }
};

/**
 * Initializes and schedules all automatic reminder jobs
 */
export const initReminderScheduler = () => {
  logger.info("⚙️ Initializing Reminder Scheduler node-cron jobs...");

  // Runs every minute to check medication reminders for current time
  cron.schedule("* * * * *", async () => {
    await checkMedicationReminders();
  });

  // Runs every 30 minutes to check appointment reminders for tomorrow
  cron.schedule("*/30 * * * *", async () => {
    await checkAppointmentReminders();
  });
};
