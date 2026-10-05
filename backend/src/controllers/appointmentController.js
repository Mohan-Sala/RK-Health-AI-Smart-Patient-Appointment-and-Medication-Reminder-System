import { prisma } from "../config/database.js";
import { successResponse } from "../utils/apiResponse.js";
import { NotFoundError, BadRequestError } from "../utils/customError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from "../services/calendarService.js";
import { createNotification } from "../services/notificationService.js";
import { sendSms, formatToE164 } from "../services/twilioService.js";
import { logger } from "../config/logger.js";
import dayjs from "dayjs";

/**
 * Create a new appointment
 * POST /api/appointments
 */
export const createAppointment = asyncHandler(async (req, res) => {
  const {
    patientName,
    doctorName,
    title,
    hospital,
    specialization,
    appointmentDate,
    appointmentTime,
    visitType,
    priority,
    notes,
  } = req.body;

  // 1. Save appointment to database
  let appointment = await prisma.appointment.create({
    data: {
      userId: req.user.id,
      patientName,
      doctorName,
      title,
      hospital,
      specialization,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      visitType: visitType || "Consultation",
      priority: priority || "Medium",
      status: "Upcoming",
      notes,
    },
  });

  // 2. Automatically create Google Calendar event in background
  const calendarResult = await createCalendarEvent(appointment, req.user);
  if (calendarResult.success) {
    appointment = await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        calendarEventId: calendarResult.eventId,
        calendarLink: calendarResult.htmlLink,
      },
    });

    // Write activity log for Calendar Event creation
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        module: "Appointment",
        action: "CALENDAR_EVENT_CREATED",
        description: `Google Calendar event synced for "${title}".`,
      },
    });
  }

  // 3. Create app notification
  await createNotification(
    req.user.id,
    "Appointment Scheduled",
    `You have scheduled an appointment with ${doctorName} on ${appointmentDate} at ${appointmentTime}.`,
    "Appointment"
  );

  // 4. Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      module: "Appointment",
      action: "CREATE",
      description: `Created appointment "${title}" with ${doctorName}.`,
    },
  });

  // 5. Automatically dispatch SMS confirmation to patient
  try {
    const patientUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { phone: true, fullName: true },
    });
    const rawPhone = req.body.phoneNumber || req.body.phone || patientUser?.phone || req.user.phone;

    // Update user phone number if newly provided in form
    if ((req.body.phoneNumber || req.body.phone) && (!patientUser?.phone || patientUser?.phone !== rawPhone)) {
      try {
        const formatted = formatToE164(rawPhone);
        if (formatted) {
          await prisma.user.update({
            where: { id: req.user.id },
            data: { phone: formatted },
          });
        }
      } catch {}
    }

    if (rawPhone) {
      const patientFirstName = (patientName || patientUser?.fullName || req.user.fullName || "Patient").split(" ")[0];
      const dateFormatted = dayjs(appointment.appointmentDate).format("YYYY-MM-DD");
      const smsBody = `Hello ${patientFirstName},\nYour appointment has been successfully scheduled with Dr. ${doctorName} at ${hospital || "Clinic"} on ${dateFormatted} at ${appointmentTime}.\nTitle: ${title}\n- RK Health`;

      const twilioRes = await sendSms(rawPhone, smsBody);
      if (twilioRes.success) {
        logger.info(`✉️ Auto-confirmation SMS dispatched to ${twilioRes.phone} for appointment ${appointment.id}`);
        await prisma.activityLog.create({
          data: {
            userId: req.user.id,
            module: "Appointment",
            action: "SMS_AUTO_CONFIRMATION",
            description: `Auto-sent confirmation SMS to ${twilioRes.phone} for appointment "${title}".`,
          },
        });
      } else {
        logger.warn(`⚠️ Auto-confirmation SMS delivery skipped: ${twilioRes.error}`);
      }
    } else {
      logger.info(`ℹ️ Auto-confirmation SMS skipped: No phone number registered for user ${req.user.id}`);
    }
  } catch (smsErr) {
    logger.warn(`⚠️ Error in auto-confirmation SMS handler: ${smsErr.message}`);
  }

  res.status(201).json(
    successResponse("Appointment created successfully", appointment, 201)
  );
});

/**
 * Get appointments belonging to the authenticated user
 * GET /api/appointments
 */
export const getAppointments = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    visitType,
    priority,
    doctor,
    hospital,
    startDate,
    endDate,
    sortBy = "newest",
  } = req.query;

  const parsedPage = parseInt(page, 10);
  const parsedLimit = parseInt(limit, 10);
  const skip = (parsedPage - 1) * parsedLimit;

  // Build filters object
  const where = {};
  if (req.user.role !== "doctor") {
    where.userId = req.user.id;
  } else if (req.query.myOnly === "true") {
    where.OR = [
      { doctorName: { contains: req.user.fullName, mode: "insensitive" } },
      { userId: req.user.id },
    ];
  }

  // Text search filter
  if (search) {
    where.OR = [
      { doctorName: { contains: search, mode: "insensitive" } },
      { title: { contains: search, mode: "insensitive" } },
      { hospital: { contains: search, mode: "insensitive" } },
      { specialization: { contains: search, mode: "insensitive" } },
    ];
  }

  // Equality filters
  if (status) where.status = status;
  if (visitType) where.visitType = visitType;
  if (priority) where.priority = priority;

  // Text contains filters
  if (doctor) where.doctorName = { contains: doctor, mode: "insensitive" };
  if (hospital) where.hospital = { contains: hospital, mode: "insensitive" };

  // Date range filter
  if (startDate || endDate) {
    where.appointmentDate = {};
    if (startDate) where.appointmentDate.gte = new Date(startDate);
    if (endDate) where.appointmentDate.lte = new Date(endDate);
  }

  // Sorting maps
  let orderBy = { createdAt: "desc" }; // default
  if (sortBy === "oldest") orderBy = { createdAt: "asc" };
  else if (sortBy === "appointmentDate") orderBy = { appointmentDate: "asc" };
  else if (sortBy === "doctorName") orderBy = { doctorName: "asc" };
  else if (sortBy === "hospitalName") orderBy = { hospital: "asc" };

  // Execute queries
  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      orderBy,
      skip,
      take: parsedLimit,
      include: {
        aiSummary: true,
        user: {
          select: { id: true, fullName: true, phone: true, email: true },
        },
      },
    }),
    prisma.appointment.count({ where }),
  ]);

  res.status(200).json(
    successResponse("Appointments retrieved successfully", {
      appointments,
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
 * Get an appointment by ID
 * GET /api/appointments/:id
 */
export const getAppointmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      aiSummary: true,
      user: {
        select: { id: true, fullName: true, phone: true, email: true },
      },
    },
  });

  if (!appointment || (appointment.userId !== req.user.id && req.user.role !== "doctor")) {
    throw new NotFoundError("Appointment not found");
  }

  res.status(200).json(
    successResponse("Appointment retrieved successfully", appointment)
  );
});

/**
 * Update an appointment
 * PUT /api/appointments/:id
 */
export const updateAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 1. Ensure appointment exists and belongs to user or doctor
  const existing = await prisma.appointment.findUnique({
    where: { id },
  });

  if (!existing || (existing.userId !== req.user.id && req.user.role !== "doctor")) {
    throw new NotFoundError("Appointment not found");
  }

  // 2. Format update payload
  const updateData = { ...req.body };
  delete updateData.rescheduleReason;
  delete updateData.phone;
  delete updateData.phoneNumber;
  if (updateData.appointmentDate) {
    updateData.appointmentDate = new Date(updateData.appointmentDate);
  }

  // Check if date or time changed
  const oldDateStr = dayjs(existing.appointmentDate).format("YYYY-MM-DD");
  const newDateStr = req.body.appointmentDate ? dayjs(req.body.appointmentDate).format("YYYY-MM-DD") : oldDateStr;
  const oldTimeStr = existing.appointmentTime;
  const newTimeStr = req.body.appointmentTime || oldTimeStr;
  const isRescheduled = oldDateStr !== newDateStr || oldTimeStr !== newTimeStr;

  // 3. Update database
  const appointment = await prisma.appointment.update({
    where: { id },
    data: updateData,
  });

  // 4. Sync Google Calendar event in background if synced
  if (appointment.calendarEventId) {
    await updateCalendarEvent(appointment.calendarEventId, appointment, req.user);

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        module: "Appointment",
        action: "CALENDAR_EVENT_UPDATED",
        description: `Google Calendar event updated for "${appointment.title}".`,
      },
    });
  }

  // 5. Send status/updated notification & Auto-dispatch SMS
  if (isRescheduled) {
    const isDoctor = req.user.role === "doctor" && existing.userId !== req.user.id;
    const notifTitle = isDoctor ? "Appointment Rescheduled by Doctor" : "Appointment Rescheduled";
    const notifMsg = isDoctor
      ? `Dr. ${req.user.fullName} has rescheduled your appointment "${existing.title}" to ${newDateStr} at ${newTimeStr}.${req.body.rescheduleReason ? " Reason: " + req.body.rescheduleReason : ""}`
      : `Your appointment "${existing.title}" with ${appointment.doctorName} has been rescheduled to ${newDateStr} at ${newTimeStr}.`;

    await createNotification(
      existing.userId,
      notifTitle,
      notifMsg,
      "Appointment"
    );

    // Auto-dispatch SMS notification to the patient
    try {
      const patientUser = await prisma.user.findUnique({
        where: { id: existing.userId },
        select: { phone: true, fullName: true },
      });
      const patientPhone = req.body.phoneNumber || req.body.phone || patientUser?.phone;

      if (patientPhone) {
        const patientFirstName = (existing.patientName || patientUser?.fullName || "Patient").split(" ")[0];
        const doctorDisplay = appointment.doctorName.startsWith("Dr.") ? appointment.doctorName : `Dr. ${appointment.doctorName}`;
        const reasonLine = req.body.rescheduleReason ? `\nReason: ${req.body.rescheduleReason}` : "";
        const smsBody = `Hello ${patientFirstName},\nYour appointment "${appointment.title}" with ${doctorDisplay} has been rescheduled to ${newDateStr} at ${newTimeStr} (${appointment.hospital || "Clinic"}).${reasonLine}\n- RK Health`;

        const twilioRes = await sendSms(patientPhone, smsBody);
        if (twilioRes.success) {
          logger.info(`✉️ Auto-reschedule SMS sent to ${twilioRes.phone} for appointment ${appointment.id}`);
          await prisma.activityLog.create({
            data: {
              userId: existing.userId,
              module: "Appointment",
              action: "SMS_AUTO_RESCHEDULE",
              description: `Auto-sent reschedule SMS to ${twilioRes.phone} for appointment "${appointment.title}".`,
            },
          });
        } else {
          logger.warn(`⚠️ Auto-reschedule SMS delivery skipped: ${twilioRes.error}`);
        }
      }
    } catch (smsErr) {
      logger.warn(`⚠️ Error dispatching auto reschedule SMS: ${smsErr.message}`);
    }
  } else if (updateData.status === "Cancelled" && existing.status !== "Cancelled") {
    await createNotification(
      existing.userId,
      "Appointment Cancelled",
      `Your appointment with ${appointment.doctorName} on ${oldDateStr} at ${oldTimeStr} has been cancelled.`,
      "Appointment"
    );

    // Send cancellation SMS to patient
    try {
      const patientUser = await prisma.user.findUnique({
        where: { id: existing.userId },
        select: { phone: true, fullName: true },
      });
      const patientPhone = patientUser?.phone;
      if (patientPhone) {
        const patientFirstName = (existing.patientName || patientUser?.fullName || "Patient").split(" ")[0];
        const smsBody = `Hello ${patientFirstName},\nYour appointment "${appointment.title}" with Dr. ${appointment.doctorName} on ${oldDateStr} at ${oldTimeStr} has been cancelled.\n- RK Health`;
        await sendSms(patientPhone, smsBody);
      }
    } catch (smsErr) {
      logger.warn(`⚠️ Error dispatching cancellation SMS: ${smsErr.message}`);
    }
  } else {
    await createNotification(
      existing.userId,
      "Appointment Updated",
      `Details for your appointment with ${appointment.doctorName} have been modified.`,
      "Appointment"
    );
  }

  // 6. Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      module: "Appointment",
      action: "UPDATE",
      description: `Updated appointment "${appointment.title}" details.`,
    },
  });

  res.status(200).json(
    successResponse("Appointment updated successfully", appointment)
  );
});

/**
 * Delete an appointment
 * DELETE /api/appointments/:id
 */
export const deleteAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 1. Ensure appointment exists and belongs to user
  const existing = await prisma.appointment.findUnique({
    where: { id },
  });

  if (!existing || existing.userId !== req.user.id) {
    throw new NotFoundError("Appointment not found");
  }

  // 2. Google Calendar deletion
  if (existing.calendarEventId) {
    await deleteCalendarEvent(existing.calendarEventId);

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        module: "Appointment",
        action: "CALENDAR_EVENT_DELETED",
        description: `Google Calendar event removed for "${existing.title}".`,
      },
    });
  }

  // 3. Delete from database
  await prisma.appointment.delete({
    where: { id },
  });

  // 4. Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      module: "Appointment",
      action: "DELETE",
      description: `Deleted appointment "${existing.title}".`,
    },
  });

  res.status(200).json(
    successResponse("Appointment deleted successfully")
  );
});
