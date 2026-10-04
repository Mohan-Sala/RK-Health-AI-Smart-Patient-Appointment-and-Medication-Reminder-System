import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { env } from "./env.js";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "RK Health Companion API",
      version: "1.0.0",
      description:
        "API Documentation for RK Health Companion — AI-powered Healthcare Management and Patient Reminder Platform",
    },
    servers: [
      {
        url: `http://localhost:${env.PORT || 5000}`,
        description: "Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    paths: {
      "/api/auth/register": {
        post: {
          summary: "Register a new user",
          tags: ["Auth"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["fullName", "email", "password"],
                  properties: {
                    fullName: { type: "string", example: "Mohan Kumar" },
                    email: { type: "string", format: "email", example: "mohan@gmail.com" },
                    password: { type: "string", example: "password123" },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "User registered successfully" },
            400: { description: "Validation failure" },
          },
        },
      },
      "/api/auth/login": {
        post: {
          summary: "Login user",
          tags: ["Auth"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email", example: "mohan@gmail.com" },
                    password: { type: "string", example: "password123" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "JWT access token returned" },
            401: { description: "Invalid credentials" },
          },
        },
      },
      "/api/appointments": {
        get: {
          summary: "List user appointments",
          tags: ["Appointments"],
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "List of appointments" },
          },
        },
        post: {
          summary: "Create appointment",
          tags: ["Appointments"],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["patientName", "doctorName", "title", "appointmentDate", "appointmentTime"],
                  properties: {
                    patientName: { type: "string", example: "Mohan Kumar" },
                    doctorName: { type: "string", example: "Dr. Jenkins" },
                    title: { type: "string", example: "Orthopedic consultation" },
                    appointmentDate: { type: "string", example: "2026-07-24" },
                    appointmentTime: { type: "string", example: "10:30" },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Created appointment" },
          },
        },
      },
      "/api/medications": {
        get: {
          summary: "List medications",
          tags: ["Medications"],
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "List of medications" },
          },
        },
      },
      "/api/dashboard": {
        get: {
          summary: "Get dashboard statistics",
          tags: ["Dashboard"],
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Dashboard summary statistics" },
          },
        },
      },
      "/api/health": {
        get: {
          summary: "Check backend health status",
          tags: ["Health"],
          responses: {
            200: { description: "Returns UP and database state" },
          },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJSDoc(options);

export const serveSwaggerDocs = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
export default serveSwaggerDocs;
