import { Router } from 'express';
import { createUrl, deleteUrl, dashboardStats, getAnalytics, listUrls, updateUrl } from '../controllers/urlController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import rateLimit from 'express-rate-limit';

const router = Router();
router.use(requireAuth);
router.get('/', asyncHandler(listUrls));
router.post('/', rateLimit({ windowMs: 60 * 60 * 1000, limit: 60, standardHeaders: 'draft-7', legacyHeaders: false, message: { success: false, message: 'You have created many links recently. Try again later.' } }), asyncHandler(createUrl));
router.get('/stats', asyncHandler(dashboardStats));
router.get('/:id/analytics', asyncHandler(getAnalytics));
router.patch('/:id', asyncHandler(updateUrl));
router.delete('/:id', asyncHandler(deleteUrl));
export default router;
