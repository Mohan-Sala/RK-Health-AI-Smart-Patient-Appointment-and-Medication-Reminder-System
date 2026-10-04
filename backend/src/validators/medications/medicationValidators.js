import { z } from "zod";

export const createMedicationSchema = z.object({
  body: z.object({
    medicineName: z
      .string({ required_error: "Medicine name is required" })
      .trim()
      .min(1, "Medicine name cannot be empty"),
    dosage: z
      .string({ required_error: "Dosage is required" })
      .trim()
      .min(1, "Dosage cannot be empty"),
    strength: z
      .string()
      .optional()
      .nullable(),
    medicineType: z
      .string()
      .optional()
      .nullable(),
    frequency: z
      .string()
      .optional()
      .nullable(),
    foodPreference: z
      .string()
      .optional()
      .nullable(),
    startDate: z
      .string({ required_error: "Start date is required" })
      .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid start date format" }),
    endDate: z
      .string({ required_error: "End date is required" })
      .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid end date format" }),
    reminderTime: z
      .string({ required_error: "Reminder time is required" })
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Reminder time must be in HH:MM format"),
    phoneNumber: z
      .string()
      .optional()
      .nullable(),
    reminderEnabled: z
      .boolean()
      .optional(),
    status: z
      .enum(["Pending", "Taken", "Missed", "Skipped"])
      .optional(),
    notes: z
      .string()
      .optional()
      .nullable(),
    patientId: z
      .string()
      .optional()
      .nullable(),
    disease: z
      .string()
      .optional()
      .nullable(),
    prescribedBy: z
      .string()
      .optional()
      .nullable(),
    patientName: z
      .string()
      .optional()
      .nullable(),
    slot: z
      .string()
      .optional()
      .nullable(),
    compliance: z
      .any()
      .optional(),
    improvementNote: z
      .string()
      .optional()
      .nullable(),
  }),
});

export const updateMedicationSchema = z.object({
  body: z.object({
    medicineName: z
      .string()
      .trim()
      .min(1, "Medicine name cannot be empty")
      .optional(),
    dosage: z
      .string()
      .trim()
      .min(1, "Dosage cannot be empty")
      .optional(),
    strength: z
      .string()
      .optional()
      .nullable(),
    medicineType: z
      .string()
      .optional()
      .nullable(),
    frequency: z
      .string()
      .optional()
      .nullable(),
    foodPreference: z
      .string()
      .optional()
      .nullable(),
    startDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid start date format" })
      .optional(),
    endDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid end date format" })
      .optional(),
    reminderTime: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Reminder time must be in HH:MM format")
      .optional(),
    phoneNumber: z
      .string()
      .optional()
      .nullable(),
    reminderEnabled: z
      .boolean()
      .optional(),
    status: z
      .enum(["Pending", "Taken", "Missed", "Skipped"])
      .optional(),
    notes: z
      .string()
      .optional()
      .nullable(),
    disease: z
      .string()
      .optional()
      .nullable(),
    improvementNote: z
      .string()
      .optional()
      .nullable(),
    prescribedBy: z
      .string()
      .optional()
      .nullable(),
    patientId: z
      .string()
      .optional()
      .nullable(),
    patientName: z
      .string()
      .optional()
      .nullable(),
    slot: z
      .string()
      .optional()
      .nullable(),
    compliance: z
      .any()
      .optional(),
  }),
});

export const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(["Pending", "Taken", "Missed", "Skipped"], {
      required_error: "Status is required",
    }),
  }),
});
