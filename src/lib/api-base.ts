/** API origin without trailing slash — avoids `//api/v1/...` when env ends with `/`. */
function normalizeApiBase(raw: string | undefined, fallback: string) {
  return (raw ?? fallback).trim().replace(/\/+$/, '');
}

/** Client + shared fallback (browser must use NEXT_PUBLIC_*). */
export function getApiBaseUrl() {
  return normalizeApiBase(process.env.NEXT_PUBLIC_API_URL, 'http://localhost:3001');
}

/** Server-side fetch origin — prefers private API_URL when set on Vercel. */
export function getServerApiBaseUrl() {
  return normalizeApiBase(
    process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL,
    'http://localhost:3001',
  );
}

export function apiUrl(path: string, server = false) {
  const base = server ? getServerApiBaseUrl() : getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}
