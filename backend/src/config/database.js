import { PrismaClient } from "@prisma/client";
import { logger } from "./logger.js";

let prisma;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  // Prevent multiple instances of Prisma Client in development hot-reloads
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ["info", "warn", "error"],
    });
  }
  prisma = global.prisma;
}

export const connectDb = async () => {
  try {
    // In Phase 1, we just attempt database connection; we won't throw block in non-prod if failed
    await prisma.$connect();
    logger.info("🔌 Database connected successfully (Prisma client active)");
  } catch (err) {
    logger.warn("⚠️ Database connection failed. Ensure DATABASE_URL is configured in .env.");
    if (process.env.NODE_ENV === "production") {
      logger.error("Fatal error on db connection", err);
      process.exit(1);
    }
  }
};

export { prisma };
