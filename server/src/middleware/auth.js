import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.token || req.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ success: false, message: 'Please log in to continue.' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ success: false, message: 'Session is no longer valid.' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Please log in to continue.' });
  }
}
