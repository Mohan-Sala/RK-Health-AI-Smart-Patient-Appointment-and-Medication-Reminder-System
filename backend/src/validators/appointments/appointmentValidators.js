import { z } from "zod";

export const createAppointmentSchema = z.object({
  body: z.object({
    patientName: z
      .string({ required_error: "Patient name is required" })
      .trim()
      .min(2, "Patient name must be at least 2 characters long"),
    doctorName: z
      .string({ required_error: "Doctor name is required" })
      .trim()
      .min(2, "Doctor name must be at least 2 characters long"),
    title: z
      .string({ required_error: "Appointment title is required" })
      .trim()
      .min(2, "Title must be at least 2 characters long"),
    hospital: z
      .string()
      .optional()
      .nullable(),
    specialization: z
      .string()
      .optional()
      .nullable(),
    appointmentDate: z
      .string({ required_error: "Appointment date is required" })
      .refine((val) => {
        const date = new Date(val);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today;
      }, {
        message: "Appointment date cannot be in the past",
      }),
    appointmentTime: z
      .string({ required_error: "Appointment time is required" })
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"),
    visitType: z
      .enum(["Consultation", "Routine", "Emergency", "Follow_up"])
      .optional(),
    priority: z
      .enum(["Low", "Medium", "High"])
      .optional(),
    notes: z
      .string()
      .optional()
      .nullable(),
  }),
});

export const updateAppointmentSchema = z.object({
  body: z.object({
    patientName: z
      .string()
      .trim()
      .min(2, "Patient name must be at least 2 characters long")
      .optional(),
    doctorName: z
      .string()
      .trim()
      .min(2, "Doctor name must be at least 2 characters long")
      .optional(),
    title: z
      .string()
      .trim()
      .min(2, "Title must be at least 2 characters long")
      .optional(),
    hospital: z
      .string()
      .optional()
      .nullable(),
    specialization: z
      .string()
      .optional()
      .nullable(),
    appointmentDate: z
      .string()
      .refine((val) => {
        const date = new Date(val);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today;
      }, {
        message: "Appointment date cannot be in the past",
      })
      .optional(),
    appointmentTime: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format")
      .optional(),
    visitType: z
      .enum(["Consultation", "Routine", "Emergency", "Follow_up"])
      .optional(),
    priority: z
      .enum(["Low", "Medium", "High"])
      .optional(),
    status: z
      .enum(["Upcoming", "Completed", "Cancelled"])
      .optional(),
    notes: z
      .string()
      .optional()
      .nullable(),
  }),
});
