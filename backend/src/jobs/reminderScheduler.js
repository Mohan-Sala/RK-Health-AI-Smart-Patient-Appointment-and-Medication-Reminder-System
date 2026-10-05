import cron from "node-cron";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { prisma } from "../config/database.js";
import { sendSms } from "../services/twilioService.js";
import { createNotification } from "../services/notificationService.js";
import { logger } from "../config/logger.js";

// Enable Day.js timezone extensions
dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = process.env.TIMEZONE || "Asia/Kolkata";

/**
 * Check and deliver medication SMS reminders:
 * 1. 30 minutes in advance of reminderTime
 * 2. At exact reminderTime
 */
const checkMedicationReminders = async () => {
  const now = dayjs().tz(TIMEZONE);
  const currentTimeString = now.format("HH:mm");
  const in30MinTimeString = now.add(30, "minute").format("HH:mm");
  const todayDate = now.toDate();

  try {
    // -------------------------------------------------------------
    // A. 30 Minutes ADVANCE Medication Reminder
    // -------------------------------------------------------------
    const advanceMedications = await prisma.medication.findMany({
      where: {
        reminderEnabled: true,
        startDate: { lte: todayDate },
        endDate: { gte: todayDate },
        reminderTime: in30MinTimeString,
      },
      include: {
        user: true,
      },
    });

    for (const med of advanceMedications) {
      const targetPhone = med.phoneNumber || med.user?.phone;
      if (!targetPhone) continue;

      // Duplicate check: skip if advance SMS was already sent in the last 45 minutes
      const recentAdvance = await prisma.activityLog.findFirst({
        where: {
          userId: med.userId,
          action: "SMS_MED_30MIN_REMINDER",
          description: { contains: med.id },
          createdAt: { gte: now.subtract(45, "minute").toDate() },
        },
      });

      if (recentAdvance) continue;

      const patientFirstName = (med.user?.fullName || "Patient").split(" ")[0];
      const foodPref = med.foodPreference ? `\nPreference: ${med.foodPreference}` : "";
      const body = `Hello ${patientFirstName},\nAdvance Reminder: In 30 minutes (${med.reminderTime}), please take your medication:\n${med.medicineName} (${med.dosage})${foodPref}\nStay healthy.\n- RK Health`;

      const twilioResult = await sendSms(targetPhone, body);

      await prisma.activityLog.create({
        data: {
          userId: med.userId,
          module: "Medication",
          action: "SMS_MED_30MIN_REMINDER",
          description: twilioResult.success
            ? `Auto-sent 30-min advance SMS for medication ${med.id} "${med.medicineName}" to ${targetPhone}.`
            : `Failed 30-min advance SMS for medication ${med.id}: ${twilioResult.error}`,
        },
      });

      if (twilioResult.success) {
        await createNotification(
          med.userId,
          "Medication in 30 Minutes",
          `Advance reminder: Take "${med.medicineName}" in 30 minutes at ${med.reminderTime}.`,
          "Medication"
        );
      }
    }

    // -------------------------------------------------------------
    // B. EXACT ON-TIME Medication Reminder
    // -------------------------------------------------------------
    const onTimeMedications = await prisma.medication.findMany({
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

    for (const med of onTimeMedications) {
      const targetPhone = med.phoneNumber || med.user?.phone;
      if (!targetPhone) continue;

      // Prevent duplicate sends within the current hour
      const startOfHour = now.startOf("hour").toDate();
      const endOfHour = now.endOf("hour").toDate();

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

      if (duplicate) continue;

      const patientFirstName = (med.user?.fullName || "Patient").split(" ")[0];
      const foodPref = med.foodPreference ? `\nPreference: ${med.foodPreference}` : "";
      const body = `Hello ${patientFirstName},\nIt is time to take your medication now (${med.reminderTime}):\n${med.medicineName} (${med.dosage})${foodPref}\nStay healthy.\n- RK Health`;

      const twilioResult = await sendSms(targetPhone, body);

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

      await prisma.activityLog.create({
        data: {
          userId: med.userId,
          module: "Medication",
          action: twilioResult.success ? "SMS_SENT" : "SMS_FAILED",
          description: twilioResult.success
            ? `Auto-sent exact-time SMS for medication "${med.medicineName}" to ${targetPhone}.`
            : `Failed auto-sending SMS reminder for medication "${med.medicineName}": ${twilioResult.error}`,
        },
      });

      if (twilioResult.success) {
        await createNotification(
          med.userId,
          "Medication Reminder Sent",
          `SMS reminder dispatched for "${med.medicineName}" (${med.reminderTime}).`,
          "Medication"
        );
      }
    }
  } catch (err) {
    logger.error("❌ Error in checkMedicationReminders cron job:", err);
  }
};

/**
 * Check and deliver appointment SMS reminders:
 * 1. 30 minutes before appointmentTime on the day of the appointment
 * 2. Advance reminder for appointments scheduled tomorrow
 */
const checkAppointmentReminders = async () => {
  const now = dayjs().tz(TIMEZONE);
  const todayStart = now.startOf("day").toDate();
  const todayEnd = now.endOf("day").toDate();
  const target30MinTime = now.add(30, "minute").format("HH:mm");

  try {
    // -------------------------------------------------------------
    // A. 30 Minutes BEFORE Appointment Time Today
    // -------------------------------------------------------------
    const appointmentsIn30Min = await prisma.appointment.findMany({
      where: {
        status: { in: ["Upcoming", "Today"] },
        appointmentDate: {
          gte: todayStart,
          lte: todayEnd,
        },
        appointmentTime: target30MinTime,
      },
      include: {
        user: true,
      },
    });

    for (const appt of appointmentsIn30Min) {
      const recipientPhone = appt.user?.phone;
      if (!recipientPhone) continue;

      // Duplicate check: skip if 30-min reminder was already dispatched today
      const duplicate = await prisma.activityLog.findFirst({
        where: {
          userId: appt.userId,
          action: "SMS_APPT_30MIN_REMINDER",
          description: { contains: appt.id },
          createdAt: { gte: todayStart },
        },
      });

      if (duplicate) continue;

      const patientFirstName = (appt.patientName || appt.user?.fullName || "Patient").split(" ")[0];
      const doctorDisplay = appt.doctorName.startsWith("Dr.") ? appt.doctorName : `Dr. ${appt.doctorName}`;
      const location = appt.hospital || "Clinic";
      const body = `Hello ${patientFirstName},\nAppointment Reminder: Your appointment with ${doctorDisplay} at ${location} is in 30 minutes (at ${appt.appointmentTime}).\nTitle: ${appt.title}\nPlease arrive on time.\n- RK Health`;

      const twilioResult = await sendSms(recipientPhone, body);

      await prisma.activityLog.create({
        data: {
          userId: appt.userId,
          module: "Appointment",
          action: "SMS_APPT_30MIN_REMINDER",
          description: twilioResult.success
            ? `Auto-sent 30-min advance SMS for appointment ${appt.id} "${appt.title}" to ${recipientPhone}.`
            : `Failed 30-min advance SMS for appointment ${appt.id}: ${twilioResult.error}`,
        },
      });

      if (twilioResult.success) {
        await createNotification(
          appt.userId,
          "Appointment in 30 Minutes",
          `Reminder: Your appointment with ${doctorDisplay} starts in 30 minutes at ${appt.appointmentTime}.`,
          "Appointment"
        );
      }
    }

    // -------------------------------------------------------------
    // B. Day-Before (Tomorrow) Appointment Reminders
    // -------------------------------------------------------------
    const tomorrowStart = now.add(1, "day").startOf("day").toDate();
    const tomorrowEnd = now.add(1, "day").endOf("day").toDate();

    const tomorrowAppointments = await prisma.appointment.findMany({
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

    for (const appt of tomorrowAppointments) {
      const recipientPhone = appt.user?.phone;
      if (!recipientPhone) continue;

      // Deduplicate: send only once per day for tomorrow's appointment
      const duplicate = await prisma.activityLog.findFirst({
        where: {
          userId: appt.userId,
          action: "SMS_APPT_TOMORROW_REMINDER",
          description: { contains: appt.id },
          createdAt: { gte: todayStart },
        },
      });

      if (duplicate) continue;

      const patientFirstName = (appt.patientName || appt.user?.fullName || "Patient").split(" ")[0];
      const doctorDisplay = appt.doctorName.startsWith("Dr.") ? appt.doctorName : `Dr. ${appt.doctorName}`;
      const dateStr = dayjs(appt.appointmentDate).tz(TIMEZONE).format("YYYY-MM-DD");
      const location = appt.hospital || "Clinic";
      const body = `Hello ${patientFirstName},\nYou have an upcoming appointment scheduled tomorrow with ${doctorDisplay} at ${location} on ${dateStr} at ${appt.appointmentTime}.\nTitle: ${appt.title}\n- RK Health`;

      const twilioResult = await sendSms(recipientPhone, body);

      await prisma.activityLog.create({
        data: {
          userId: appt.userId,
          module: "Appointment",
          action: "SMS_APPT_TOMORROW_REMINDER",
          description: twilioResult.success
            ? `Auto-sent tomorrow SMS for appointment ${appt.id} "${appt.title}".`
            : `Failed tomorrow SMS for appointment ${appt.id}: ${twilioResult.error}`,
        },
      });

      if (twilioResult.success) {
        await createNotification(
          appt.userId,
          "Appointment Scheduled Tomorrow",
          `Reminder: You have an appointment tomorrow with ${doctorDisplay} at ${appt.appointmentTime}.`,
          "Appointment"
        );
      }
    }
  } catch (err) {
    logger.error("❌ Error in checkAppointmentReminders cron job:", err);
  }
};

/**
 * Initializes and schedules all automatic reminder jobs
 */
export const initReminderScheduler = () => {
  logger.info(`⚙️ Initializing Reminder Scheduler node-cron jobs (Timezone: ${TIMEZONE})...`);

  // Runs every minute to deliver:
  // - 30-min advance medication SMS reminders
  // - Exact on-time medication SMS reminders
  // - 30-min advance appointment SMS reminders
  // - Tomorrow appointment SMS reminders
  cron.schedule("* * * * *", async () => {
    await checkMedicationReminders();
    await checkAppointmentReminders();
  });
};
