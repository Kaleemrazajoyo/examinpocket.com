export function normalizeOneDriveLink(book) {
  if (!book?.url) return { url: '#', embedUrl: '', downloadUrl: '#' };

  const url = book.url;
  const embedUrl = book.embedUrl || url;
  const downloadUrl = book.downloadUrl || url;
  return { url, embedUrl, downloadUrl };
}

export function isEmbeddable(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname.includes('onedrive') ||
      parsed.hostname.includes('sharepoint') ||
      parsed.hostname.includes('drive.google.com')
    );
  } catch {
    return false;
  }
}
