import { Router } from "express";
import {
  sendSystemNotification,
  getNotifications,
  getNotificationById,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// Protect all routes underneath
router.use(protect);

router.post("/send", sendSystemNotification);
router.get("/", getNotifications);
router.patch("/read-all", markAllNotificationsRead);
router.get("/:id", getNotificationById);
router.patch("/:id/read", markNotificationRead);
router.delete("/:id", deleteNotification);

export default router;
