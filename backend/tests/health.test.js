import request from "supertest";
import app from "../src/app.js";
import { prisma } from "../src/config/database.js";

describe("🏥 Health & System Status API Tests", () => {
  beforeAll(async () => {
    // Wait for prisma database connection
    await prisma.$connect();
  }, 30000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("GET /api/health returns 200 with database status", async () => {
    const res = await request(app).get("/api/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("healthy");
    expect(res.body.data.database).toBeDefined();
  });

  test("GET /api/status returns 200 uptime and environment variables configuration statuses", async () => {
    const res = await request(app).get("/api/status");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.server).toBe("UP");
    expect(res.body.data.services).toHaveProperty("groqAi");
    expect(res.body.data.services).toHaveProperty("twilioSms");
  });

  test("GET /api/version returns 200 application version number", async () => {
    const res = await request(app).get("/api/version");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.version).toBe("1.0.0");
  });
});
