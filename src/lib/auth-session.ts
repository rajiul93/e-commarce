import type { AuthResult } from '@/types';
import { apiUrl } from '@/lib/api-base';
import { useAuthStore } from '@/stores/auth-store';

let refreshInFlight: Promise<boolean> | null = null;

export async function refreshSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const res = await fetch(apiUrl('/api/v1/user/refresh'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = (await res.json()) as { data?: AuthResult; message?: string };
      if (!res.ok || !json.data?.accessToken) return false;
      useAuthStore.getState().setAuth(json.data);
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function logoutSession(): Promise<void> {
  try {
    await fetch(apiUrl('/api/v1/user/logout'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    /* ignore */
  }
  useAuthStore.getState().clearAuth();
}

export function shouldAttemptRefresh(path: string): boolean {
  return (
    !path.includes('/user/refresh') &&
    !path.includes('/user/login') &&
    !path.includes('/user/create') &&
    !path.includes('/user/logout')
  );
}
