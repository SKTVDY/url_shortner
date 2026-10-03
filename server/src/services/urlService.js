import Url from '../models/Url.js';
import { safeShortCode } from '../utils/validation.js';

const ALIAS_PATTERN = /^[a-zA-Z0-9_-]{3,30}$/;
const RESERVED_CODES = new Set(['api', 'login', 'register', 'dashboard', 'profile', 'favicon.ico', 'robots.txt']);

export async function createShortUrl({ originalUrl, alias, expiresAt, userId }) {
  let shortCode;
  if (alias) {
    const normalized = alias.trim();
    if (!ALIAS_PATTERN.test(normalized)) {
      const error = new Error('Custom aliases must be 3–30 characters and use only letters, numbers, hyphens, or underscores.');
      error.status = 400;
      throw error;
    }
    if (RESERVED_CODES.has(normalized.toLowerCase())) {
      const error = new Error('That custom alias is reserved. Please choose another one.');
      error.status = 400;
      throw error;
    }
    shortCode = normalized;
  } else {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const candidate = safeShortCode();
      if (!(await Url.exists({ shortCode: candidate }))) { shortCode = candidate; break; }
    }
    if (!shortCode) {
      const error = new Error('Could not generate a unique short link. Please try again.');
      error.status = 503;
      throw error;
    }
  }
  if (await Url.exists({ shortCode })) {
    const error = new Error('That custom alias is already taken. Try a different one.');
    error.status = 409;
    throw error;
  }
  return Url.create({ originalUrl, shortCode, isCustomAlias: Boolean(alias), user: userId, expiresAt: expiresAt || null });
}
