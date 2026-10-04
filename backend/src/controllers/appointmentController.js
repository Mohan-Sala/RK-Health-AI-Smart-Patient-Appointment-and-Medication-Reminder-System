import { prisma } from "../config/database.js";
import { successResponse } from "../utils/apiResponse.js";
import { NotFoundError, BadRequestError } from "../utils/customError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from "../services/calendarService.js";
import { createNotification } from "../services/notificationService.js";

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
  if (updateData.appointmentDate) {
    updateData.appointmentDate = new Date(updateData.appointmentDate);
  }

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

  // 5. Send status/updated notification
  if (req.user.role === "doctor" && existing.userId !== req.user.id) {
    const isRescheduled = req.body.appointmentDate || req.body.appointmentTime;
    if (isRescheduled) {
      const newDateStr = req.body.appointmentDate
        ? new Date(req.body.appointmentDate).toISOString().slice(0, 10)
        : existing.appointmentDate.toISOString().slice(0, 10);
      const newTimeStr = req.body.appointmentTime || existing.appointmentTime;
      await createNotification(
        existing.userId,
        "Appointment Rescheduled by Doctor",
        `Dr. ${req.user.fullName} has rescheduled your appointment "${existing.title}" to ${newDateStr} at ${newTimeStr} based on availability.${req.body.rescheduleReason ? " Reason: " + req.body.rescheduleReason : ""}`,
        "Appointment"
      );
    }
  } else if (updateData.status === "Cancelled" && existing.status !== "Cancelled") {
    await createNotification(
      existing.userId,
      "Appointment Cancelled",
      `Your appointment with ${appointment.doctorName} on ${appointment.appointmentDate.toISOString().slice(0, 10)} has been cancelled.`,
      "Appointment"
    );
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
