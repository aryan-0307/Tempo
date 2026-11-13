/**
 * Authentication Express Routes (Phase 5)
 */

import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', requireAuth, authController.getMe);
router.post('/logout', authController.logout);

export default router;

