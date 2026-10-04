import { Router } from "express";
import {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
} from "../controllers/appointmentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import {
  createAppointmentSchema,
  updateAppointmentSchema,
} from "../validators/appointments/appointmentValidators.js";

const router = Router();

// Protect all routes underneath
router.use(protect);

router.post("/", validate(createAppointmentSchema), createAppointment);
router.get("/", getAppointments);
router.get("/:id", getAppointmentById);
router.put("/:id", validate(updateAppointmentSchema), updateAppointment);
router.delete("/:id", deleteAppointment);

export default router;
