import type { ApiResponse } from '@/types';
import { logoutSession, refreshSession, shouldAttemptRefresh } from '@/lib/auth-session';
import { getAuthToken } from '@/stores/auth-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type FetchOptions = RequestInit & {
  token?: string | null;
  params?: Record<string, string | number | undefined>;
  _retried?: boolean;
};

function buildUrl(path: string, params?: FetchOptions['params']) {
  const url = new URL(`${API_URL}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

export async function apiFetch<T>(
  path: string,
  { token, params, headers, _retried, ...init }: FetchOptions = {},
): Promise<T> {
  const authToken = token ?? getAuthToken();
  const res = await fetch(buildUrl(path, params), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
    credentials: 'include',
  });

  const json = (await res.json()) as ApiResponse<T>;

  if (res.status === 401 && !_retried && shouldAttemptRefresh(path)) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return apiFetch<T>(path, {
        token,
        params,
        headers,
        _retried: true,
        ...init,
      });
    }
    await logoutSession();
  }

  if (!res.ok) {
    throw new ApiError(json.message ?? 'Request failed', res.status);
  }

  return json.data;
}

export { API_URL };
