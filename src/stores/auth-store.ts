'use client';

import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AuthResult, AuthUser } from '@/types';

type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
  setAuth: (data: AuthResult) => void;
  clearAuth: () => void;
  isAdmin: () => boolean;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      setAuth: (data) =>
        set({ accessToken: data.accessToken, user: data.token }),
      clearAuth: () => set({ accessToken: null, user: null }),
      isAdmin: () => get().user?.role === 'ADMIN',
    }),
    {
      name: 'ecommerce-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
      }),
    },
  ),
);

/** Wait for localStorage rehydration before auth guards run (avoids logout on refresh). */
export function useAuthHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const store = useAuthStore.persist;

    if (store.hasHydrated()) {
      setHydrated(true);
      return;
    }

    const unsub = store.onFinishHydration(() => setHydrated(true));
    store.rehydrate();
    return unsub;
  }, []);

  return hydrated;
}

export function getAuthToken(): string | null {
  return useAuthStore.getState().accessToken;
}
