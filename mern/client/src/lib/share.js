/**
 * Sharing helpers.
 *
 * Every MCQ has a permanent deep link (/mcq/:id) so a shared message always
 * opens the exact question with its explanation expanded.
 */

import { SITE_URL } from './seoMeta.js';

const LETTERS = ['A', 'B', 'C', 'D'];

export function mcqUrl(id) {
  return `${SITE_URL}/mcq/${id}`;
}

export function buildMcqShareMessage(mcq, id) {
  const options = mcq?.options || [];
  const lines = options.map((opt, i) => `${LETTERS[i] || '?'}) ${opt}`);

  return [
    `Q: ${mcq?.question || ''}`,
    '',
    lines.slice(0, 2).join('   '),
    lines.slice(2, 4).join('   '),
    '',
    '👉 Check Answer & Explanation on ExamInPocket:',
    mcqUrl(id),
  ].join('\n');
}

export function shareOnWhatsApp(message) {
  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export async function copyMcqLink(id) {
  const url = mcqUrl(id);
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(url);
      return true;
    }
  } catch {
    // fall through to the legacy path
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = url;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-1000px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
