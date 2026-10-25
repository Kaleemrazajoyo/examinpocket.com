import { ApiError } from '../utils/errors.js';

const CONSUMER_HOSTS = new Set([
  '1drv.ms',
  '1drv.com',
  'onedrive.live.com',
  'onedrive.com',
  'onedrive.com',
]);

function isSharePoint(hostname) {
  return hostname.endsWith('.sharepoint.com') || hostname.endsWith('.office.com');
}

export function isOneDrive(hostname) {
  return CONSUMER_HOSTS.has(hostname) || isSharePoint(hostname);
}

/** Follow short-link redirects (1drv.ms) without downloading the file. */
async function followRedirects(startUrl) {
  let current = startUrl;
  for (let hop = 0; hop < 4; hop += 1) {
    let response;
    try {
      response = await fetch(current, {
        method: 'GET',
        redirect: 'manual',
        signal: AbortSignal.timeout(7000),
        headers: { 'user-agent': 'Mozilla/5.0 (compatible; ExamInPocket/1.0)' },
      });
    } catch {
      break;
    }

    response.body?.cancel?.();
    const location = response.headers.get('location');
    if (!location) break;

    try {
      current = new URL(location, current).href;
    } catch {
      break;
    }
  }
  return current;
}

function googleDriveEmbed(url) {
  const match =
    url.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    url.searchParams.get('id');
  const id = Array.isArray(match) ? match[1] : match;
  if (!id) return null;
  return `https://drive.google.com/file/d/${id}/preview`;
}

/**
 * Normalize any supported document link into:
 * { provider, kind, url, embedUrl, downloadUrl, warning }
 */
export async function resolveLink(input) {
  const raw = String(input || '').trim();
  if (!raw) throw new ApiError(400, 'A link is required');

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new ApiError(400, 'That is not a valid URL');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new ApiError(400, 'Only http(s) links are supported');
  }

  let resolved = parsed.href;
  if (parsed.hostname === '1drv.ms' || parsed.hostname === '1drv.com') {
    resolved = await followRedirects(parsed.href);
  }

  const url = new URL(resolved);

  if (isSharePoint(url.hostname)) {
    const embed = new URL(url.href);
    embed.searchParams.set('web', '1');
    const download = new URL(url.href);
    download.searchParams.set('download', '1');
    return {
      provider: 'onedrive',
      kind: 'business',
      url: url.href,
      embedUrl: embed.href,
      downloadUrl: download.href,
      warning: null,
    };
  }

  if (CONSUMER_HOSTS.has(url.hostname)) {
    const params = url.searchParams;
    const cid = params.get('cid') || params.get('CID');
    const resid =
      params.get('resid') ||
      params.get('id') ||
      params.get('Id') ||
      params.get('resid');
    const authkey = params.get('authkey') || params.get('AuthKey');

    if (!cid || !resid) {
      return {
        provider: 'onedrive',
        kind: 'consumer',
        url: url.href,
        embedUrl: url.href,
        downloadUrl: url.href,
        warning:
          'Could not read the file id from this link. Open the file in OneDrive and copy the link again.',
      };
    }

    const query = new URLSearchParams({ cid, resid });
    if (authkey) query.set('authkey', authkey);

    const embedQuery = new URLSearchParams(query);
    embedQuery.set('em', '2');

    return {
      provider: 'onedrive',
      kind: 'consumer',
      url: url.href,
      embedUrl: `https://onedrive.live.com/embed?${embedQuery.toString()}`,
      downloadUrl: `https://onedrive.live.com/download?${query.toString()}`,
      warning: authkey
        ? null
        : 'This OneDrive link has no auth key. Set sharing to "Anyone with the link can view" or students will be asked to sign in.',
    };
  }

  // Non-OneDrive: keep the link, but embed known providers when possible.
  const driveEmbed = url.hostname.includes('drive.google.com')
    ? googleDriveEmbed(url)
    : null;

  return {
    provider: 'external',
    kind: 'external',
    url: url.href,
    embedUrl: driveEmbed || url.href,
    downloadUrl: url.href,
    warning: driveEmbed
      ? null
      : 'This is not a OneDrive link. The reader will fall back to "Open in new tab".',
  };
}
