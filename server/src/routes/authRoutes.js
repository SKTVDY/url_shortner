import { Router } from 'express';
import { login, logout, me, register } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.post('/logout', logout);
router.get('/me', requireAuth, me);
export default router;
