import request from "supertest";
import app from "../src/app.js";
import { prisma } from "../src/config/database.js";

describe("⚙️ User Settings preferences API Tests", () => {
  let token;
  const testEmail = `tester-${Date.now()}@gmail.com`;

  beforeAll(async () => {
    await prisma.$connect();

    // Register and login test user
    await request(app)
      .post("/api/auth/register")
      .send({
        fullName: "Settings Tester",
        email: testEmail,
        password: "password123",
        confirmPassword: "password123",
      });

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: testEmail,
        password: "password123",
      });

    token = loginRes.body.data?.token;
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

  test("GET /api/settings returns default settings", async () => {
    if (!token) throw new Error("Token was not generated in beforeAll");
    const res = await request(app)
      .get("/api/settings")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("darkModePreference");
    expect(res.body.data.language).toBe("en");
  }, 20000);

  test("PUT /api/settings updates user preferences successfully", async () => {
    if (!token) throw new Error("Token was not generated in beforeAll");
    const res = await request(app)
      .put("/api/settings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        darkModePreference: true,
        language: "fr",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.darkModePreference).toBe(true);
    expect(res.body.data.language).toBe("fr");
  }, 20000);
}, 30000);
