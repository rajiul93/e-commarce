'use client';

import { refreshSession } from '@/lib/auth-session';
import { useAuthHydrated } from '@/stores/auth-store';
import { useEffect, useRef } from 'react';

/** Silently refresh access token from httpOnly cookie after localStorage rehydrates. */
export function AuthInitializer() {
  const hydrated = useAuthHydrated();
  const ran = useRef(false);

  useEffect(() => {
    if (!hydrated || ran.current) return;
    ran.current = true;
    void refreshSession();
  }, [hydrated]);

  return null;
}
