import { successResponse } from "../utils/apiResponse.js";
import { env } from "../config/env.js";
import { prisma } from "../config/database.js";

/**
 * Returns basic healthcheck status
 * GET /api/health
 */
export const getHealth = async (req, res) => {
  let databaseStatus = "UP";
  try {
    if (typeof prisma.$runCommandRaw === "function") {
      await prisma.$runCommandRaw({ ping: 1 });
    } else {
      await prisma.user.findFirst();
    }
  } catch (err) {
    databaseStatus = "DOWN";
  }

  res.status(200).json(
    successResponse("RK Health Backend Healthcheck", {
      status: "healthy",
      database: databaseStatus,
      timestamp: new Date().toISOString(),
    })
  );
};

/**
 * Returns detailed application status metrics
 * GET /api/status
 */
export const getStatus = async (req, res) => {
  let databaseStatus = "UP";
  try {
    if (typeof prisma.$runCommandRaw === "function") {
      await prisma.$runCommandRaw({ ping: 1 });
    } else {
      await prisma.user.findFirst();
    }
  } catch (err) {
    databaseStatus = "DOWN";
  }

  const aiStatus = env.GROQ_API_KEY ? "CONFIGURED" : "NOT_CONFIGURED";
  const twilioStatus =
    env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER
      ? "CONFIGURED"
      : "NOT_CONFIGURED";
  const calendarStatus =
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REFRESH_TOKEN
      ? "CONFIGURED"
      : "NOT_CONFIGURED";

  res.status(200).json(
    successResponse("Detailed system status metrics", {
      server: "UP",
      database: databaseStatus,
      services: {
        groqAi: aiStatus,
        twilioSms: twilioStatus,
        googleCalendar: calendarStatus,
      },
      environment: env.NODE_ENV,
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    })
  );
};

/**
 * Returns application version
 * GET /api/version
 */
export const getVersion = (req, res) => {
  res.status(200).json(
    successResponse("Application version retrieved", {
      version: "1.0.0",
      releaseDate: "2026-07-09",
    })
  );
};
