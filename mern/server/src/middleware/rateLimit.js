import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

export const aiLimiter = rateLimit({
  windowMs: env.aiWindowMinutes * 60 * 1000,
  limit: env.aiMaxRequests,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: {
    error: {
      code: 429,
      message: `AI limit reached. Try again in ${env.aiWindowMinutes} minutes.`,
    },
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.isProd ? 30 : 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { code: 429, message: 'Too many attempts. Try again later.' } },
});
