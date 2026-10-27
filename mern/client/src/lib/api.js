const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      (typeof payload === 'string' ? payload : 'Request failed');
    throw new Error(message);
  }

  return payload?.data !== undefined ? payload.data : payload;
}

export const api = {
  get: (path, opts = {}) => request(path, opts),
  post: (path, body, opts = {}) => request(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined, ...opts }),
  patch: (path, body, opts = {}) => request(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined, ...opts }),
  put: (path, body, opts = {}) => request(path, { method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined, ...opts }),
  delete: (path, opts = {}) => request(path, { method: 'DELETE', ...opts }),
};
