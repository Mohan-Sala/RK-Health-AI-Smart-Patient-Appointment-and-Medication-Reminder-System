import winston from "winston";
import morgan from "morgan";
import fs from "fs";

// Create logs directory if not exists
if (!fs.existsSync("logs")) {
  fs.mkdirSync("logs");
}

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `[${info.timestamp}] [${info.level}]: ${info.message}`
  )
);

const transports = [
  new winston.transports.Console({ format }),
  new winston.transports.File({
    filename: "logs/error.log",
    level: "error",
    format: winston.format.combine(winston.format.uncolorize(), winston.format.json()),
  }),
  new winston.transports.File({
    filename: "logs/combined.log",
    format: winston.format.combine(winston.format.uncolorize(), winston.format.json()),
  }),
];

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  levels,
  transports,
});

// Stream for morgan logs integration
const stream = {
  write: (message) => logger.http(message.trim()),
};

export const requestLoggerMiddleware = morgan(
  process.env.NODE_ENV === "production" ? "combined" : "dev",
  { stream }
);
