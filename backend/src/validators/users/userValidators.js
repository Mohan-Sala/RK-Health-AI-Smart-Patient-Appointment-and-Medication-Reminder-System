import { z } from "zod";

const bloodGroupSchema = z.preprocess((value) => {
  if (value === undefined) return undefined;
  if (value === null || String(value).trim() === "") return null;
  return String(value).trim().toUpperCase();
}, z.union([
  z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),
  z.null(),
]).optional());

const lifestyleSchema = z.preprocess((value) => {
  if (value === undefined) return undefined;
  if (value === null || String(value).trim() === "") return null;
  return String(value).trim();
}, z.union([
  z.enum(["Active", "Moderately Active", "Sedentary", "Athlete", "Other"]),
  z.null(),
]).optional());

const genderSchema = z.preprocess((value) => {
  if (value === undefined) return undefined;
  if (value === null || String(value).trim() === "") return null;
  const raw = String(value).trim();
  const capitalized = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  return capitalized;
}, z.union([
  z.enum(["Male", "Female", "Other"]),
  z.null(),
]).optional());

const nullableNumberSchema = (min, max) =>
  z.preprocess((value) => {
    if (value === undefined) return undefined;
    if (value === null || String(value).trim() === "") return null;
    const cleaned = String(value).replace(/[^\d.]/g, "");
    if (!cleaned) return null;
    const normalized = Number(cleaned);
    return Number.isNaN(normalized) ? value : normalized;
  }, z.union([z.number().min(min).max(max), z.null()]).optional());

const nullableTextSchema = (maxLength = 1000) =>
  z.preprocess((value) => {
    if (value === undefined) return undefined;
    if (value === null || String(value).trim() === "") return null;
    return String(value).trim();
  }, z.union([z.string().max(maxLength), z.null()]).optional());

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z
      .preprocess((val) => {
        if (val === undefined) return undefined;
        return String(val || "").trim();
      }, z.string().min(2, "Full name must be at least 2 characters long"))
      .optional(),
    phone: nullableTextSchema(30),
    dateOfBirth: nullableTextSchema(50),
    gender: genderSchema,
    profileImage: nullableTextSchema(2000),
    bloodGroup: bloodGroupSchema,
    height: nullableNumberSchema(30, 300),
    weight: nullableNumberSchema(2, 500),
    allergies: nullableTextSchema(1000),
    medicalConditions: nullableTextSchema(1000),
    insurance: nullableTextSchema(200),
    insuranceProvider: nullableTextSchema(200),
    bmi: z.preprocess((value) => {
      if (value === undefined) return undefined;
      if (value === null || String(value).trim() === "") return null;
      const normalized = Number(value);
      return Number.isNaN(normalized) ? value : normalized;
    }, z.union([z.number(), z.null()]).optional()),
    lifestyle: lifestyleSchema,
    emergencyContactName: nullableTextSchema(100),
    emergencyContactPhone: nullableTextSchema(50),
    specialization: nullableTextSchema(100),
    hospital: nullableTextSchema(150),
    availability: nullableTextSchema(150),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z
      .string({ required_error: "Current password is required" }),
    newPassword: z
      .string({ required_error: "New password is required" })
      .min(6, "New password must be at least 6 characters long"),
    confirmPassword: z
      .string({ required_error: "Confirm password is required" }),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  }),
});
