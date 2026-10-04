import request from "supertest";
import app from "../src/app.js";
import { prisma } from "../src/config/database.js";

describe("🛡️ User Authentication API Tests", () => {
  const testEmail = `tester-${Date.now()}@gmail.com`;
  const testPassword = "password123";

  beforeAll(async () => {
    await prisma.$connect();
  }, 20000);

  afterAll(async () => {
    try {
      await prisma.user.deleteMany({
        where: { email: testEmail },
      });
    } catch (err) {
      // Ignore
    }
    await prisma.$disconnect();
  }, 20000);

  test("POST /api/auth/register creates user successfully", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        fullName: "API Tester",
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("id");
    expect(res.body.data.email).toBe(testEmail);
  }, 20000);

  test("POST /api/auth/register rejects registering duplicate email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        fullName: "Duplicate User",
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  }, 20000);

  test("POST /api/auth/login logs user in and returns token", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: testEmail,
        password: testPassword,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("token");
  }, 20000);

  test("POST /api/auth/login rejects incorrect passwords", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: testEmail,
        password: "wrongpassword",
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  }, 20000);
}, 30000);
