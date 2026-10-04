import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import apiRouter from "./routes/index.js";
import { serveSwaggerDocs } from "./config/swagger.js";

const app = express();

// 1. Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: true, // Allow frontend request matching in development
    credentials: true,
  })
);

// 2. Performance Middlewares
app.use(compression());

// 3. Request Parsing Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 4. Request Logging
app.use(requestLogger);

// 5. Global Rate Limiter
app.use("/api", rateLimiter);

// Serve OpenAPI/Swagger documentation
serveSwaggerDocs(app);

// 6. Serve static uploads
app.use("/uploads", express.static("uploads"));

// 7. Base API Router
app.use("/api", apiRouter);

// 8. 404 Error Fallback Handler
app.use(notFoundHandler);

// 9. Global Centralized Error Handler
app.use(errorHandler);

export default app;
