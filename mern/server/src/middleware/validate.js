import { ApiError } from '../utils/errors.js';

/**
 * Validate req[source] with a zod schema and replace it with the parsed value.
 * source: 'body' | 'query' | 'params'
 */
export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(new ApiError(400, 'Validation failed', result.error.flatten()));
    }
    req[source] = result.data;
    return next();
  };
}
