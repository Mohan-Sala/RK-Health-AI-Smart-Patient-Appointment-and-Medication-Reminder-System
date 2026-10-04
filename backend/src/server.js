import app from "./app.js";
import { env, validateEnv } from "./config/env.js";
import { connectDb } from "./config/database.js";
import { logger } from "./config/logger.js";
import { initReminderScheduler } from "./jobs/reminderScheduler.js";

// Validate environment variables on startup
validateEnv();

const startServer = async () => {
  // Connect to postgres database using Prisma client
  await connectDb();

  // Initialize automated cron scheduling for SMS/Calendar reminders
  initReminderScheduler();

  // Run the Express HTTP listener
  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    logger.info(`🔗 API Healthcheck available at http://localhost:${env.PORT}/api/health`);
  });

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (err) => {
    logger.error("💥 Unhandled Promise Rejection! Shutting down server...", err);
    server.close(() => {
      process.exit(1);
    });
  });

  // Handle SIGTERM graceful shutdown
  process.on("SIGTERM", () => {
    logger.warn("⚠️ SIGTERM received. Shutting down gracefully...");
    server.close(() => {
      logger.info("💤 Process terminated.");
    });
  });
};

startServer();
// Export app for integration testing
export { app };
