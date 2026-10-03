import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import User from '../models/User.js';

const cookieOptions = () => ({ httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000, path: '/' });
const publicUser = (user) => ({ id: user.id, name: user.name, email: user.email });

function setToken(res, user) {
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, cookieOptions());
}

export async function register(req, res) {
  const { name, email, password } = req.body;
  if (!name?.trim() || name.trim().length > 80) return res.status(400).json({ success: false, message: 'Please enter your name (up to 80 characters).' });
  if (!validator.isEmail(email || '')) return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
  if (typeof password !== 'string' || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) return res.status(400).json({ success: false, message: 'Password needs 8 characters, an uppercase letter, a lowercase letter, and a number.' });
  if (await User.exists({ email: email.toLowerCase().trim() })) return res.status(409).json({ success: false, message: 'An account with that email already exists.' });
  const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), password: await bcrypt.hash(password, 12) });
  setToken(res, user);
  return res.status(201).json({ success: true, data: { user: publicUser(user) } });
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (!validator.isEmail(email || '') || typeof password !== 'string') return res.status(400).json({ success: false, message: 'Please enter your email and password.' });
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ success: false, message: 'Email or password is incorrect.' });
  setToken(res, user);
  return res.json({ success: true, data: { user: publicUser(user) } });
}

export function logout(req, res) {
  res.clearCookie('token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' });
  return res.json({ success: true, data: { message: 'You are signed out.' } });
}

export function me(req, res) {
  return res.json({ success: true, data: { user: publicUser(req.user) } });
}
