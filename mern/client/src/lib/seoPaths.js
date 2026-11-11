/**
 * URL slug helpers.
 *
 * Category names in MongoDB contain spaces, "&" and slashes
 * ("Basic Computer Operations & IT"). These helpers convert them into
 * clean, crawlable URL segments and back again.
 */

export function toSlug(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function findCategoryBySlug(list, slug) {
  if (!slug) return null;
  const target = String(slug).toLowerCase();
  return (list || []).find((name) => toSlug(name) === target) || null;
}
