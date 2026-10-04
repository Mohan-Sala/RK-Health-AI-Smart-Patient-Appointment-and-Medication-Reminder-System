import { Router } from "express";
import healthRouter from "./healthRoutes.js";
import authRouter from "./authRoutes.js";
import userRouter from "./userRoutes.js";
import appointmentRouter from "./appointmentRoutes.js";
import medicationRouter from "./medicationRoutes.js";
import dashboardRouter from "./dashboardRoutes.js";
import reportRouter from "./reportRoutes.js";
import aiRouter from "./aiRoutes.js";
import calendarRouter from "./calendarRoutes.js";
import smsRouter from "./smsRoutes.js";
import activityRouter from "./activityRoutes.js";
import notificationRouter from "./notificationRoutes.js";
import profileRouter from "./profileRoutes.js";
import settingsRouter from "./settingsRoutes.js";
import searchRouter from "./searchRoutes.js";

const apiRouter = Router();

// Mount all routes under /api
apiRouter.use("/", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/appointments", appointmentRouter);
apiRouter.use("/medications", medicationRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/reports", reportRouter);
apiRouter.use("/ai", aiRouter);
apiRouter.use("/calendar", calendarRouter);
apiRouter.use("/sms", smsRouter);
apiRouter.use("/activity", activityRouter);
apiRouter.use("/notifications", notificationRouter);
apiRouter.use("/profile", profileRouter);
apiRouter.use("/settings", settingsRouter);
apiRouter.use("/search", searchRouter);

export default apiRouter;
