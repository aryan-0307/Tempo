/**
 * Authentication & Cryptography Utilities (Phase 5)
 * Handles bcrypt password hashing and JWT token issuance / verification.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'tempo_fallback_secret_key_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Hashes a plaintext password securely using bcrypt.
 * @param {string} password
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compares plaintext password against a bcrypt hash.
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export async function comparePassword(password, hash) {
  if (!password || !hash) return false;
  return bcrypt.compare(password, hash);
}

/**
 * Signs a JWT authentication token for a user.
 * @param {object} user - User object containing id, email, username
 * @returns {string} Signed JWT token
 */
export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN
    }
  );
}

/**
 * Verifies and decodes a JWT token.
 * @param {string} token
 * @returns {object} Decoded token payload
 */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

