export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/** Wrap async route handlers so rejected promises reach the error middleware. */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const notFound = (req, _res, next) =>
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
