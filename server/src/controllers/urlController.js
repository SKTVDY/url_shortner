import crypto from 'node:crypto';
import Click from '../models/Click.js';
import Url from '../models/Url.js';
import { createShortUrl } from '../services/urlService.js';
import { validateHttpUrl } from '../utils/validation.js';

const serializeUrl = (url, req) => ({
  id: url.id,
  originalUrl: url.originalUrl,
  shortCode: url.shortCode,
  isCustomAlias: Boolean(url.isCustomAlias),
  shortUrl: `${req.protocol}://${req.get('host')}/${url.shortCode}`,
  clicks: url.clicks,
  createdAt: url.createdAt,
  expiresAt: url.expiresAt,
  lastClickedAt: url.lastClickedAt,
  isActive: url.isActive
});

export async function createUrl(req, res) {
  const { originalUrl, alias, expiresAt } = req.body;
  if (!validateHttpUrl(originalUrl)) return res.status(400).json({ success: false, message: 'Enter a valid URL starting with http:// or https://.' });
  if (expiresAt && (!Number.isFinite(Date.parse(expiresAt)) || Date.parse(expiresAt) <= Date.now())) return res.status(400).json({ success: false, message: 'Expiration must be a future date.' });
  const url = await createShortUrl({ originalUrl: originalUrl.trim(), alias, expiresAt, userId: req.user.id });
  return res.status(201).json({ success: true, data: { url: serializeUrl(url, req) } });
}

export async function listUrls(req, res) {
  const query = { user: req.user.id };
  if (req.query.search) {
    const search = String(req.query.search).slice(0, 100);
    query.$or = [{ originalUrl: { $regex: escapeRegex(search), $options: 'i' } }, { shortCode: { $regex: escapeRegex(search), $options: 'i' } }];
  }
  const urls = await Url.find(query).sort({ createdAt: -1 }).limit(200);
  return res.json({ success: true, data: { urls: urls.map((url) => serializeUrl(url, req)) } });
}

export async function dashboardStats(req, res) {
  const [totalUrls, clickTotals, activeUrls, expiredUrls] = await Promise.all([
    Url.countDocuments({ user: req.user.id }),
    Url.aggregate([{ $match: { user: req.user._id } }, { $group: { _id: null, total: { $sum: '$clicks' } } }]),
    Url.countDocuments({ user: req.user.id, isActive: true, $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] }),
    Url.countDocuments({ user: req.user.id, expiresAt: { $ne: null, $lte: new Date() } })
  ]);
  return res.json({ success: true, data: { stats: { totalUrls, totalClicks: clickTotals[0]?.total || 0, activeUrls, expiredUrls } } });
}

export async function deleteUrl(req, res) {
  const url = await Url.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!url) return res.status(404).json({ success: false, message: 'Link not found.' });
  await Click.deleteMany({ url: url.id });
  return res.json({ success: true, data: { message: 'Link deleted.' } });
}

export async function updateUrl(req, res) {
  const url = await Url.findOne({ _id: req.params.id, user: req.user.id });
  if (!url) return res.status(404).json({ success: false, message: 'Link not found.' });
  if (typeof req.body.isActive === 'boolean') url.isActive = req.body.isActive;
  if (req.body.expiresAt !== undefined) {
    if (req.body.expiresAt && (!Number.isFinite(Date.parse(req.body.expiresAt)) || Date.parse(req.body.expiresAt) <= Date.now())) return res.status(400).json({ success: false, message: 'Expiration must be a future date.' });
    url.expiresAt = req.body.expiresAt || null;
  }
  await url.save();
  return res.json({ success: true, data: { url: serializeUrl(url, req) } });
}

export async function getAnalytics(req, res) {
  const url = await Url.findOne({ _id: req.params.id, user: req.user.id });
  if (!url) return res.status(404).json({ success: false, message: 'Link not found.' });
  const since = new Date();
  since.setDate(since.getDate() - 13);
  const [clicks, daily] = await Promise.all([
    Click.countDocuments({ url: url.id }),
    Click.aggregate([
      { $match: { url: url._id, timestamp: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])
  ]);
  const byDate = new Map(daily.map((item) => [item._id, item.count]));
  const trend = Array.from({ length: 14 }, (_, index) => {
    const day = new Date(since);
    day.setDate(since.getDate() + index);
    const key = day.toISOString().slice(0, 10);
    return { date: key, clicks: byDate.get(key) || 0 };
  });
  return res.json({ success: true, data: { analytics: { url: serializeUrl(url, req), totalClicks: clicks, trend } } });
}

export async function redirectUrl(req, res, next) {
  try {
    const url = await Url.findOne({ shortCode: req.params.shortCode });
    if (!url || !url.isActive || (url.expiresAt && url.expiresAt <= new Date())) return res.status(404).send('This short link is unavailable.');
    await Url.updateOne({ _id: url.id }, { $inc: { clicks: 1 }, $set: { lastClickedAt: new Date() } });
    const forwarded = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';
    const salt = process.env.IP_HASH_SECRET || process.env.JWT_SECRET;
    const ipHash = crypto.createHmac('sha256', salt).update(forwarded).digest('hex');
    void Click.create({ url: url.id, referrer: req.get('referer') || '', userAgent: req.get('user-agent') || '', ipHash }).catch((error) => console.error('Could not record click:', error.message));
    return res.redirect(302, url.originalUrl);
  } catch (error) { return next(error); }
}

function escapeRegex(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
