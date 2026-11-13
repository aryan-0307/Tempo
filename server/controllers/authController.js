/**
 * Authentication Controller (Phase 5)
 * Handles user registration, credential validation, login, profile retrieval, and logout.
 */

import { usersRepository } from '../db/repositories/usersRepository.js';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;

export const authController = {
  // POST /api/auth/register
  async register(req, res, next) {
    try {
      const { username, email, password, fullName, avatarColor } = req.body || {};

      // 1. Validation
      if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Full name is required and must be at least 2 characters.'
        });
      }

      if (!username || !USERNAME_REGEX.test(username.trim())) {
        return res.status(400).json({
          success: false,
          error: 'Username must be 3-30 characters containing only letters, numbers, underscores, or hyphens.'
        });
      }

      if (!email || !EMAIL_REGEX.test(email.trim())) {
        return res.status(400).json({
          success: false,
          error: 'A valid email address is required.'
        });
      }

      if (!password || typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({
          success: false,
          error: 'Password is required and must be at least 8 characters long.'
        });
      }

      // 2. Uniqueness Checks
      const existingEmail = await usersRepository.findByEmail(email);
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          error: 'An account with this email address already exists.'
        });
      }

      const existingUsername = await usersRepository.findByUsername(username);
      if (existingUsername) {
        return res.status(409).json({
          success: false,
          error: 'This username is already taken. Please choose another.'
        });
      }

      // 3. Hash Password & Create User
      const passwordHash = await hashPassword(password);
      const newUser = await usersRepository.create({
        username,
        email,
        passwordHash,
        fullName,
        avatarColor: avatarColor || '#84B3CE'
      });

      // 4. Generate Authentication Token
      const token = generateToken(newUser);

      res.status(201).json({
        success: true,
        message: 'User registered successfully.',
        data: {
          user: newUser,
          token
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/auth/login
  async login(req, res, next) {
    try {
      const { email, password } = req.body || {};

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Both email and password are required.'
        });
      }

      const user = await usersRepository.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password.'
        });
      }

      const isMatch = await comparePassword(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password.'
        });
      }

      const userProfile = {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        avatarColor: user.avatarColor
      };

      const token = generateToken(userProfile);

      res.json({
        success: true,
        message: 'Login successful.',
        data: {
          user: userProfile,
          token
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/auth/me
  async getMe(req, res, next) {
    try {
      res.json({
        success: true,
        data: req.user
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/auth/logout
  async logout(req, res, next) {
    try {
      res.json({
        success: true,
        message: 'Logout successful.'
      });
    } catch (err) {
      next(err);
    }
  }
};

