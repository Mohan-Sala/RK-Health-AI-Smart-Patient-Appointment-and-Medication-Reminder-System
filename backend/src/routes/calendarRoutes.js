import { Router } from "express";
import {
  syncEvent,
  editEvent,
  removeEvent,
  getEvents,
} from "../controllers/calendarController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// Protect all routes underneath
router.use(protect);

router.post("/create-event", syncEvent);
router.put("/update-event", editEvent);
router.delete("/delete-event", removeEvent);
router.get("/events", getEvents);

export default router;
