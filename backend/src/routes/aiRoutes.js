import { Router } from "express";
import {
  generateSummary,
  getSummaries,
  getSummaryById,
  regenerateSummary,
  deleteSummary,
  getReportData,
} from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { generateSummarySchema } from "../validators/ai/aiValidators.js";

const router = Router();

// Protect all routes underneath
router.use(protect);

router.post("/generate-summary", validate(generateSummarySchema), generateSummary);
router.get("/summaries", getSummaries);
router.get("/summaries/:id", getSummaryById);
router.put("/summaries/:id/regenerate", regenerateSummary);
router.delete("/summaries/:id", deleteSummary);
router.get("/summaries/:id/report", getReportData);

export default router;
