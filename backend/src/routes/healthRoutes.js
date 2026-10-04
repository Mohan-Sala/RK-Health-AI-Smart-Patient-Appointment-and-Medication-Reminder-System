import { Router } from "express";
import { getHealth, getStatus, getVersion } from "../controllers/healthController.js";

const router = Router();

router.get("/health", getHealth);
router.get("/status", getStatus);
router.get("/version", getVersion);

export default router;
