import { Router } from "express";
import { executeGlobalSearch } from "../controllers/searchController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// Protect all routes underneath
router.use(protect);

router.get("/", executeGlobalSearch);

export default router;
