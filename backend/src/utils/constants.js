// Shared constants for RK Health backend configuration and options

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
};

export const APPOINTMENT_STATUS = {
  TODAY: "Today",
  UPCOMING: "Upcoming",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const MEDICATION_STATUS = {
  PENDING: "Pending",
  TAKEN: "Taken",
  SKIPPED: "Skipped",
  MISSED: "Missed",
};

export const VISIT_TYPES = ["Consultation", "Follow-up", "Emergency", "Routine Checkup"];
export const PRIORITIES = ["Low", "Medium", "High"];
export const MEDICATION_TYPES = ["Tablet", "Capsule", "Syrup", "Injection", "Drops"];
export const MEDICATION_SLOTS = ["Morning", "Afternoon", "Evening", "Night"];
export const MEDICATION_FREQUENCIES = [
  "Once Daily",
  "Twice Daily",
  "Three Times Daily",
  "Weekly",
  "Monthly",
];
export const FOOD_PREFERENCES = ["Before Food", "After Food", "With Food"];
