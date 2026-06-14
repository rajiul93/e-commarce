/** API origin without trailing slash — avoids `//api/v1/...` when env ends with `/`. */
export function getApiBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  return raw.trim().replace(/\/+$/, '');
}

export function apiUrl(path: string) {
  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}
