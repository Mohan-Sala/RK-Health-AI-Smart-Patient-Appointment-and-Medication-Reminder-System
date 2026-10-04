import { Router } from "express";
import {
  generateReport,
  getReports,
  getReportById,
  downloadPdfReport,
  downloadExcelReport,
  downloadCsvReport,
  deleteReport,
} from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// Protect all routes underneath
router.use(protect);

router.post("/generate", generateReport);
router.get("/", getReports);
router.get("/:id", getReportById);
router.get("/:id/pdf", downloadPdfReport);
router.get("/:id/excel", downloadExcelReport);
router.get("/:id/csv", downloadCsvReport);
router.delete("/:id", deleteReport);

export default router;
