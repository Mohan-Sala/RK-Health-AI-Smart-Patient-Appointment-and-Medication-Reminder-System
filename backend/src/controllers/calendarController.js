import { prisma } from "../config/database.js";
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  listCalendarEvents,
} from "../services/calendarService.js";
import { successResponse } from "../utils/apiResponse.js";
import { NotFoundError, BadRequestError } from "../utils/customError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Manually create/sync Google Calendar event for an appointment
 * POST /api/calendar/create-event
 */
export const syncEvent = asyncHandler(async (req, res) => {
  const { appointmentId } = req.body;

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { user: true },
  });

  const isDoctor = req.user.role === "doctor";
  if (!appointment || (!isDoctor && appointment.userId !== req.user.id)) {
    throw new NotFoundError("Appointment not found.");
  }

  const calendarResult = await createCalendarEvent(appointment, appointment.user || req.user);
  if (!calendarResult.success) {
    throw new BadRequestError(`Calendar sync failed: ${calendarResult.error}`);
  }

  // Save details to database
  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      calendarEventId: calendarResult.eventId,
      calendarLink: calendarResult.htmlLink,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      module: "Appointment",
      action: "CALENDAR_EVENT_CREATED",
      description: `Manually synced Google Calendar event for appointment "${appointment.title}".`,
    },
  });

  res.status(200).json(
    successResponse("Google Calendar event created successfully", updated)
  );
});

/**
 * Manually update Google Calendar event
 * PUT /api/calendar/update-event
 */
export const editEvent = asyncHandler(async (req, res) => {
  const { appointmentId } = req.body;

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { user: true },
  });

  const isDoctor = req.user.role === "doctor";
  if (!appointment || (!isDoctor && appointment.userId !== req.user.id)) {
    throw new NotFoundError("Appointment not found.");
  }

  if (!appointment.calendarEventId) {
    throw new BadRequestError("This appointment is not currently synced to Google Calendar.");
  }

  const calendarResult = await updateCalendarEvent(
    appointment.calendarEventId,
    appointment,
    req.user
  );

  if (!calendarResult.success) {
    throw new BadRequestError(`Calendar update failed: ${calendarResult.error}`);
  }

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      module: "Appointment",
      action: "CALENDAR_EVENT_UPDATED",
      description: `Manually updated Google Calendar event for appointment "${appointment.title}".`,
    },
  });

  res.status(200).json(
    successResponse("Google Calendar event updated successfully", appointment)
  );
});

/**
 * Manually delete Google Calendar event
 * DELETE /api/calendar/delete-event
 */
export const removeEvent = asyncHandler(async (req, res) => {
  const { appointmentId } = req.body;

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });

  const isDoctor = req.user.role === "doctor";
  if (!appointment || (!isDoctor && appointment.userId !== req.user.id)) {
    throw new NotFoundError("Appointment not found.");
  }

  if (!appointment.calendarEventId) {
    throw new BadRequestError("This appointment has no active Google Calendar event ID.");
  }

  const calendarResult = await deleteCalendarEvent(appointment.calendarEventId);
  if (!calendarResult.success) {
    throw new BadRequestError(`Calendar deletion failed: ${calendarResult.error}`);
  }

  // Clear Calendar info from appointment
  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      calendarEventId: null,
      calendarLink: null,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      module: "Appointment",
      action: "CALENDAR_EVENT_DELETED",
      description: `Manually deleted Google Calendar event for appointment "${appointment.title}".`,
    },
  });

  res.status(200).json(
    successResponse("Google Calendar event deleted successfully", updated)
  );
});

/**
 * List events from calendar
 * GET /api/calendar/events
 */
export const getEvents = asyncHandler(async (req, res) => {
  const events = await listCalendarEvents();
  res.status(200).json(
    successResponse("Calendar events fetched successfully", events)
  );
});
