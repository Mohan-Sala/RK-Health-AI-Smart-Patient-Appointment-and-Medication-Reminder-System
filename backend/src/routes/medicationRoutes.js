import { Router } from "express";
import {
  createMedication,
  getMedications,
  getMedicationById,
  updateMedication,
  deleteMedication,
  updateMedicationStatus,
  updateCompliance,
} from "../controllers/medicationController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import {
  createMedicationSchema,
  updateMedicationSchema,
  updateStatusSchema,
} from "../validators/medications/medicationValidators.js";

const router = Router();

// Protect all routes underneath
router.use(protect);

router.post("/", validate(createMedicationSchema), createMedication);
router.get("/", getMedications);
router.get("/:id", getMedicationById);
router.put("/:id", validate(updateMedicationSchema), updateMedication);
router.delete("/:id", deleteMedication);
router.patch("/:id/status", validate(updateStatusSchema), updateMedicationStatus);
router.patch("/:id/compliance", updateCompliance);

export default router;
