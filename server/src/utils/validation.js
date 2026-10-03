import validator from 'validator';
import { randomBytes } from 'node:crypto';

export function validateHttpUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) return false;
  try {
    const parsed = new URL(value);
    return ['http:', 'https:'].includes(parsed.protocol) && validator.isURL(value, { require_protocol: true, protocols: ['http', 'https'], require_valid_protocol: true, allow_underscores: true });
  } catch { return false; }
}

export function safeShortCode(length = 7) {
  const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  while (code.length < length) {
    for (const byte of randomBytes(length * 2)) {
      if (byte < 248) code += alphabet[byte % alphabet.length];
      if (code.length === length) break;
    }
  }
  return code;
}
