import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes.js';
import urlRoutes from './routes/urlRoutes.js';
import { redirectUrl } from './controllers/urlController.js';
import { errorHandler, notFound } from './middleware/errors.js';

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '16kb' }));
app.use(cookieParser());

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false, message: { success: false, message: 'Too many attempts. Please wait a little and try again.' } });
const redirectLimiter = rateLimit({ windowMs: 60 * 1000, limit: 600, standardHeaders: 'draft-7', legacyHeaders: false });

app.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok' } }));
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/urls', urlRoutes);
app.get('/:shortCode', redirectLimiter, redirectUrl);
app.use(notFound);
app.use(errorHandler);

export default app;
