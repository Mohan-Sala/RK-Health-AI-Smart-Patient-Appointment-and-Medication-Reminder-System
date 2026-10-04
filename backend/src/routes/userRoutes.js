import { Router } from "express";
import { getProfile, updateProfile, changePassword, getPatients, getDoctors } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import {
  updateProfileSchema,
  changePasswordSchema,
} from "../validators/users/userValidators.js";

const router = Router();

// Protect all routes underneath
router.use(protect);

router.get("/profile", getProfile);
router.put("/profile", validate(updateProfileSchema), updateProfile);
router.put("/change-password", validate(changePasswordSchema), changePassword);
router.get("/patients", getPatients);
router.get("/doctors", getDoctors);

export default router;
