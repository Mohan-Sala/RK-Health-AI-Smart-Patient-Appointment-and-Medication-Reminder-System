import { Router } from "express";
import {
  getProfile,
  updateProfile,
  updateAvatar,
  deleteAvatar,
} from "../controllers/profileController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { uploadAvatar } from "../middleware/uploadMiddleware.js";
import { updateProfileSchema } from "../validators/users/userValidators.js";

const router = Router();

// Protect all routes underneath
router.use(protect);

router.get("/", getProfile);
router.put("/", validate(updateProfileSchema), updateProfile);
router.put("/avatar", uploadAvatar.single("avatar"), updateAvatar);
router.delete("/avatar", deleteAvatar);

export default router;
