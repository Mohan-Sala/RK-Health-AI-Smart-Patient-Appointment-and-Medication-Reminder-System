import { Router } from "express";
import {
  sendMedicationSmsReminder,
  sendAppointmentSmsReminder,
  getSmsHistory,
  getSmsStatus,
} from "../controllers/smsController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// Protect all routes underneath
router.use(protect);

router.post("/send-medication-reminder", sendMedicationSmsReminder);
router.post("/send-appointment-reminder", sendAppointmentSmsReminder);
router.get("/history", getSmsHistory);
router.get("/status/:id", getSmsStatus);

export default router;
