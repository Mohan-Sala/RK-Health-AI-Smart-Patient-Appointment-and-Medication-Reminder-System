import { Router } from "express";
import {
  getDashboardSummary,
  getStats,
  getChartsData,
  getRecentActivity,
  getUpcomingAppointments,
  getTodayMedications,
  getCompliance,
  getNotifications,
  getCalendarPreview,
  globalSearch,
} from "../controllers/dashboardController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// Protect all routes underneath
router.use(protect);

router.get("/", getDashboardSummary);
router.get("/stats", getStats);
router.get("/charts", getChartsData);
router.get("/recent-activity", getRecentActivity);
router.get("/upcoming-appointments", getUpcomingAppointments);
router.get("/today-medications", getTodayMedications);
router.get("/compliance", getCompliance);
router.get("/notifications", getNotifications);
router.get("/calendar-preview", getCalendarPreview);
router.get("/search", globalSearch);

export default router;
