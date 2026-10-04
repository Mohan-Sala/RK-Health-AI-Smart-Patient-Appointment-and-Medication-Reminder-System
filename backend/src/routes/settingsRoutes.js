import { Router } from "express";
import { getSettings, updateSettings } from "../controllers/settingsController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// Protect all routes underneath
router.use(protect);

router.get("/", getSettings);
router.put("/", updateSettings);

export default router;
