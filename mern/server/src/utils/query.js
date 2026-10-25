export function parsePagination(query, defaults = {}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || defaults.limit || 20));
  return { page, limit, skip: (page - 1) * limit };
}

export function paged(items, total, page, limit) {
  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

/** Escape user input before using it inside a RegExp. */
export function escapeRegex(value = '') {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Pick only the keys that are defined, so PATCH requests don't wipe fields. */
export function definedOnly(object) {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined)
  );
}
