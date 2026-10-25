import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const TOKEN_COOKIE = 'eip_token';

export function signToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProd,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}
