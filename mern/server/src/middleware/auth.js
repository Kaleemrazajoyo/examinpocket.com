import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/errors.js';
import { TOKEN_COOKIE } from '../utils/jwt.js';

function readToken(req) {
  const cookieToken = req.cookies?.[TOKEN_COOKIE];
  if (cookieToken) return cookieToken;

  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

export function requireAuth(req, _res, next) {
  const token = readToken(req);
  if (!token) return next(new ApiError(401, 'Authentication required'));

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch {
    return next(new ApiError(401, 'Invalid or expired session'));
  }
}

export function requireAdmin(req, _res, next) {
  if (req.user?.role !== 'admin') {
    return next(new ApiError(403, 'Admin access required'));
  }
  return next();
}

/** Attaches req.user when a valid session exists, but never blocks the request. */
export function optionalAuth(req, _res, next) {
  const token = readToken(req);
  if (!token) return next();

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = { id: payload.sub, role: payload.role };
  } catch {
    // ignore invalid tokens on public routes
  }
  return next();
}
