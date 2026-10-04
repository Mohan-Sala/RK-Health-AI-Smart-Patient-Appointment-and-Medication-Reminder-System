import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

// Helper to get Google API Access Token using Refresh Token
const getAccessToken = async () => {
  const params = new URLSearchParams();
  params.append("client_id", env.GOOGLE_CLIENT_ID);
  params.append("client_secret", env.GOOGLE_CLIENT_SECRET);
  params.append("refresh_token", env.GOOGLE_REFRESH_TOKEN || "");
  params.append("grant_type", "refresh_token");

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error_description || "Token exchange failed");
    }
    return data.access_token;
  } catch (err) {
    logger.error("🔑 Google OAuth access token generation failed:", err);
    return null;
  }
};

/**
 * Creates a Google Calendar event for an appointment
 * @returns {Promise<{success: boolean, eventId?: string, htmlLink?: string, error?: string}>}
 */
export const createCalendarEvent = async (appointment, user) => {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: "Google OAuth credentials not configured" };
  }

  // Combine appointmentDate and appointmentTime (format e.g. "2026-05-24" + "10:30")
  const dateStr = new Date(appointment.appointmentDate).toISOString().slice(0, 10);
  const startDateTime = `${dateStr}T${appointment.appointmentTime}:00`;

  // Default end time +30 minutes
  const [hour, min] = appointment.appointmentTime.split(":").map(Number);
  const endMin = (min + 30) % 60;
  const endHour = hour + Math.floor((min + 30) / 60);
  const endStr = `${endHour.toString().padStart(2, "0")}:${endMin.toString().padStart(2, "0")}`;
  const endDateTime = `${dateStr}T${endStr}:00`;

  const eventBody = {
    summary: appointment.title,
    description: `RK Health Appointment.\nPatient: ${appointment.patientName}\nVisit Type: ${appointment.visitType}\nNotes: ${appointment.notes || ""}`,
    location: appointment.hospital || "Not specified",
    start: {
      dateTime: startDateTime,
      timeZone: "Asia/Kolkata",
    },
    end: {
      dateTime: endDateTime,
      timeZone: "Asia/Kolkata",
    },
    attendees: [{ email: user.email }],
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 24 * 60 },
        { method: "popup", minutes: 30 },
      ],
    },
  };

  const calendarId = env.GOOGLE_CALENDAR_ID || "primary";

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventBody),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "Event creation request failed");
    }

    logger.info(`📅 Google Calendar event created successfully. Event ID: ${data.id}`);
    return { success: true, eventId: data.id, htmlLink: data.htmlLink };
  } catch (err) {
    logger.error("❌ Google Calendar event creation failed:", err);
    return { success: false, error: err.message };
  }
};

/**
 * Updates an existing Google Calendar event
 */
export const updateCalendarEvent = async (eventId, appointment, user) => {
  const token = await getAccessToken();
  if (!token) return { success: false, error: "Google OAuth credentials not configured" };

  const dateStr = new Date(appointment.appointmentDate).toISOString().slice(0, 10);
  const startDateTime = `${dateStr}T${appointment.appointmentTime}:00`;

  const [hour, min] = appointment.appointmentTime.split(":").map(Number);
  const endMin = (min + 30) % 60;
  const endHour = hour + Math.floor((min + 30) / 60);
  const endStr = `${endHour.toString().padStart(2, "0")}:${endMin.toString().padStart(2, "0")}`;
  const endDateTime = `${dateStr}T${endStr}:00`;

  const eventBody = {
    summary: appointment.title,
    description: `RK Health Appointment.\nPatient: ${appointment.patientName}\nVisit Type: ${appointment.visitType}\nNotes: ${appointment.notes || ""}`,
    location: appointment.hospital || "Not specified",
    start: {
      dateTime: startDateTime,
      timeZone: "Asia/Kolkata",
    },
    end: {
      dateTime: endDateTime,
      timeZone: "Asia/Kolkata",
    },
  };

  const calendarId = env.GOOGLE_CALENDAR_ID || "primary";

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
      {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventBody),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "Event update request failed");
    }

    logger.info(`📅 Google Calendar event updated. Event ID: ${data.id}`);
    return { success: true, eventId: data.id, htmlLink: data.htmlLink };
  } catch (err) {
    logger.error("❌ Google Calendar event update failed:", err);
    return { success: false, error: err.message };
  }
};

/**
 * Deletes an existing Google Calendar event
 */
export const deleteCalendarEvent = async (eventId) => {
  const token = await getAccessToken();
  if (!token) return { success: false, error: "Google OAuth credentials not configured" };

  const calendarId = env.GOOGLE_CALENDAR_ID || "primary";

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
      {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error?.message || "Event deletion request failed");
    }

    logger.info(`📅 Google Calendar event deleted. Event ID: ${eventId}`);
    return { success: true };
  } catch (err) {
    logger.error("❌ Google Calendar event deletion failed:", err);
    return { success: false, error: err.message };
  }
};

/**
 * List events from calendar
 */
export const listCalendarEvents = async () => {
  const token = await getAccessToken();
  if (!token) return [];

  const calendarId = env.GOOGLE_CALENDAR_ID || "primary";

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?maxResults=20&orderBy=startTime&singleEvents=true`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to list calendar events");
    }

    return data.items || [];
  } catch (err) {
    logger.error("❌ Google Calendar list events failed:", err);
    return [];
  }
};
