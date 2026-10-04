import { Router } from "express";
import {
  getActivityLogs,
  getActivityLogById,
  deleteActivityLog,
} from "../controllers/activityController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// Protect all routes underneath
router.use(protect);

router.get("/", getActivityLogs);
router.get("/:id", getActivityLogById);
router.delete("/:id", deleteActivityLog);

export default router;
