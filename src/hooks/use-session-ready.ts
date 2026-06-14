'use client';

import { refreshSession } from '@/lib/auth-session';
import { useAuthHydrated } from '@/stores/auth-store';
import { useEffect, useState } from 'react';

/** Wait for localStorage hydrate + one refresh attempt before auth guards run. */
export function useSessionReady() {
  const hydrated = useAuthHydrated();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    void refreshSession().finally(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [hydrated]);

  return hydrated && ready;
}
