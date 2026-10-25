import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler, ApiError } from '../utils/errors.js';
import { signToken, cookieOptions, TOKEN_COOKIE } from '../utils/jwt.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = Router();

const emailField = z.string().trim().toLowerCase().email();
const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: emailField,
  password: z.string().min(6).max(128),
});
const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1).max(128),
});

function startSession(res, user) {
  res.cookie(TOKEN_COOKIE, signToken(user), cookieOptions());
  return { user };
}

router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const existing = await User.exists({ email });
    if (existing) throw new ApiError(409, 'An account with this email already exists');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role: 'student' });

    res.status(201).json({ data: startSession(res, user) });
  })
);

router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) throw new ApiError(401, 'Invalid email or password');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new ApiError(401, 'Invalid email or password');

    res.json({ data: startSession(res, user) });
  })
);

router.post(
  '/logout',
  asyncHandler(async (_req, res) => {
    res.clearCookie(TOKEN_COOKIE, { ...cookieOptions(), maxAge: undefined });
    res.json({ data: { ok: true } });
  })
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) throw new ApiError(401, 'Session no longer valid');
    res.json({ data: { user } });
  })
);

export default router;
