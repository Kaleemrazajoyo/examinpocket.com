/**
 * Dynamic document metadata.
 *
 * The app is a single-page app, so every "page" must update <title>,
 * the description, the canonical URL and the social preview tags itself.
 * Keeping this in one place means crawlers and WhatsApp/Facebook previews
 * always see the right values for the URL that is actually open.
 */

export const SITE_URL = 'https://examinpocket.com';

export const DEFAULT_TITLE = 'ExamInPocket.com - CSS, PMS, PCS, CCE & Competitive Exam Portal';
export const DEFAULT_DESCRIPTION =
  'ExamInPocket.com offers verified MCQs, solved past papers, Dawn vocabulary, editorial articles, timed mock tests and an AI tutor for CSS, PMS, PPSC, FPSC, SPSC and CCE exams.';
export const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

function upsertMeta(attr, key, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel, href) {
  if (!href) return;
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function setPageMeta({ title, description, path = '/', image } = {}) {
  const finalTitle = title || DEFAULT_TITLE;
  const finalDescription = description || DEFAULT_DESCRIPTION;
  const url = `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  document.title = finalTitle;
  upsertMeta('name', 'description', finalDescription);
  upsertMeta('property', 'og:title', finalTitle);
  upsertMeta('property', 'og:description', finalDescription);
  upsertMeta('property', 'og:url', url);
  upsertMeta('name', 'twitter:title', finalTitle);
  upsertMeta('name', 'twitter:description', finalDescription);
  upsertMeta('property', 'og:image', image || DEFAULT_IMAGE);
  upsertMeta('name', 'twitter:image', image || DEFAULT_IMAGE);
  upsertLink('canonical', url);
}

export function resetPageMeta() {
  setPageMeta({ title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, path: '/' });
}
