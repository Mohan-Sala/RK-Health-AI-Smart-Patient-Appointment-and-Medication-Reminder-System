import { prisma } from "../config/database.js";
import { sendSms } from "../services/twilioService.js";
import { createNotification } from "../services/notificationService.js";
import { successResponse } from "../utils/apiResponse.js";
import { NotFoundError, BadRequestError } from "../utils/customError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Send manual Medication SMS reminder
 * POST /api/sms/send-medication-reminder
 */
export const sendMedicationSmsReminder = asyncHandler(async (req, res) => {
  const { medicationId } = req.body;

  // 1. Fetch medication and ensure user or doctor owns/manages it
  const medication = await prisma.medication.findUnique({
    where: { id: medicationId },
    include: { user: true },
  });

  const isDoctor = req.user.role === "doctor";
  if (!medication || (!isDoctor && medication.userId !== req.user.id)) {
    throw new NotFoundError("Medication record not found.");
  }

  const rawPhone = medication.phoneNumber || medication.user?.phone || req.user.phone;
  if (!rawPhone) {
    throw new BadRequestError("No phone number configured for this medication reminder. Please update your mobile number in Settings.");
  }

  // 2. Format SMS body using patient name
  const patientFirstName = (medication.user?.fullName || req.user.fullName).split(" ")[0];
  const body = `Hello ${patientFirstName},\nThis is your RK Health reminder.\nPlease take:\n${medication.medicineName} (${medication.dosage})\nTime: ${medication.reminderTime}\nStay healthy.`;

  // 3. Call Twilio service
  const twilioResult = await sendSms(rawPhone, body);
  const targetPhone = twilioResult.phone || rawPhone;

  // 4. Save history in ReminderHistory
  const log = await prisma.reminderHistory.create({
    data: {
      medicationId,
      reminderType: "SMS",
      status: twilioResult.success ? "Sent" : "Failed",
      deliveryProvider: "Twilio",
      deliveryTime: new Date(),
      response: twilioResult.success ? `SMS SID: ${twilioResult.sid}` : twilioResult.error,
    },
  });

  // 5. Generate app notification
  await createNotification(
    medication.userId,
    "Medication Reminder Sent",
    `SMS reminder sent to ${targetPhone} for medication "${medication.medicineName}".`,
    "Medication"
  );

  // 6. Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      module: "Medication",
      action: twilioResult.success ? "SMS_SENT" : "SMS_FAILED",
      description: twilioResult.success
        ? `Sent SMS reminder for medication "${medication.medicineName}" to ${targetPhone}.`
        : `Failed to send SMS reminder for medication "${medication.medicineName}": ${twilioResult.error}`,
    },
  });

  if (!twilioResult.success) {
    throw new BadRequestError(`Failed to send SMS: ${twilioResult.error}`);
  }

  res.status(200).json(
    successResponse("Reminder SMS sent successfully", {
      ...log,
      phone: targetPhone,
      simulated: twilioResult.simulated,
    })
  );
});

/**
 * Send manual Appointment SMS reminder
 * POST /api/sms/send-appointment-reminder
 */
export const sendAppointmentSmsReminder = asyncHandler(async (req, res) => {
  const { appointmentId, phoneNumber } = req.body;

  // 1. Fetch appointment
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { user: true },
  });

  const isDoctor = req.user.role === "doctor";
  if (!appointment || (!isDoctor && appointment.userId !== req.user.id)) {
    throw new NotFoundError("Appointment record not found.");
  }

  const rawPhone = phoneNumber || appointment.user?.phone || req.user.phone;
  if (!rawPhone) {
    throw new BadRequestError("Recipient phone number is required to send reminder. Please update your mobile number in Settings.");
  }

  // 2. Format SMS body
  const patientFirstName = (appointment.patientName || appointment.user?.fullName || req.user.fullName || "Patient").split(" ")[0];
  const dateStr = appointment.appointmentDate ? new Date(appointment.appointmentDate).toISOString().slice(0, 10) : "today";
  const body = `Hello ${patientFirstName},\nYou have an appointment scheduled with Dr. ${appointment.doctorName} at ${appointment.hospital || "clinic"} on ${dateStr} at ${appointment.appointmentTime}.\nTitle: ${appointment.title}`;

  // 3. Call Twilio
  const twilioResult = await sendSms(rawPhone, body);
  const targetPhone = twilioResult.phone || rawPhone;

  // 4. Generate app notification
  await createNotification(
    req.user.id,
    "Appointment Reminder Sent",
    `SMS reminder sent to ${targetPhone} for appointment "${appointment.title}".`,
    "Appointment"
  );

  // 5. Log activity audit
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      module: "Appointment",
      action: twilioResult.success ? "SMS_SENT" : "SMS_FAILED",
      description: twilioResult.success
        ? `Sent SMS reminder for appointment "${appointment.title}" to ${targetPhone}.`
        : `Failed to send SMS reminder for appointment "${appointment.title}": ${twilioResult.error}`,
    },
  });

  if (!twilioResult.success) {
    throw new BadRequestError(`Failed to send SMS: ${twilioResult.error}`);
  }

  res.status(200).json(
    successResponse("Reminder SMS sent successfully", {
      phone: targetPhone,
      sid: twilioResult.sid,
      simulated: twilioResult.simulated,
    })
  );
});

/**
 * Get SMS log history
 * GET /api/sms/history
 */
export const getSmsHistory = asyncHandler(async (req, res) => {
  const history = await prisma.reminderHistory.findMany({
    where: {
      medication: { userId: req.user.id },
      reminderType: "SMS",
    },
    include: {
      medication: true,
    },
    orderBy: { deliveryTime: "desc" },
  });

  res.status(200).json(
    successResponse("SMS reminder history retrieved successfully", history)
  );
});

/**
 * Retrieve status check details for a reminder log by ID
 * GET /api/sms/status/:id
 */
export const getSmsStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const log = await prisma.reminderHistory.findUnique({
    where: { id },
    include: { medication: true },
  });

  if (!log || log.medication.userId !== req.user.id) {
    throw new NotFoundError("Reminder history log not found.");
  }

  res.status(200).json(
    successResponse("SMS log status retrieved", {
      id: log.id,
      medicineName: log.medication.medicineName,
      status: log.status,
      deliveryTime: log.deliveryTime,
      response: log.response,
    })
  );
});
