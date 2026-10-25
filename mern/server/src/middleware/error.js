import { env } from '../config/env.js';
import { ApiError } from '../utils/errors.js';

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      error: { code: err.status, message: err.message, details: err.details },
    });
  }

  if (err?.name === 'ValidationError') {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Database validation failed',
        details: Object.fromEntries(
          Object.entries(err.errors || {}).map(([key, value]) => [key, value.message])
        ),
      },
    });
  }

  if (err?.code === 11000) {
    return res.status(409).json({
      error: { code: 409, message: 'A record with this value already exists' },
    });
  }

  if (err?.name === 'CastError') {
    return res.status(400).json({ error: { code: 400, message: 'Invalid identifier' } });
  }

  if (!env.isProd) console.error('[error]', err);

  return res.status(500).json({
    error: {
      code: 500,
      message: env.isProd ? 'Internal server error' : err.message || 'Internal server error',
    },
  });
}
