import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

/**
 * Sign a JWT access token for a given user ID
 * @param {string} id 
 * @returns {string} token
 */
export const generateToken = (id) => {
  return jwt.sign({ id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

/**
 * Verify a JWT access token
 * @param {string} token 
 * @returns {object} decoded payload
 */
export const verifyToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};
