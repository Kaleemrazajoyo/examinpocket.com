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

/**
 * Human-readable label from a slug ("basic-computer-operations-and-it"
 * becomes "Basic Computer Operations & IT"). Used to set page metadata
 * before the category list has loaded from the API.
 */
export function fromSlug(slug) {
  return String(slug || '')
    .split('-')
    .filter(Boolean)
    .map((word) => (word === 'and' ? '&' : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ');
}
