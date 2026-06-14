'use client';

import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import type { UserProfile } from '@/types';
import { useEffect, useState } from 'react';

export default function ProfileSettingsPage() {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!token) return;
    apiFetch<UserProfile>('/api/v1/user/me', { token })
      .then(setProfile)
      .catch(() => setProfile(null));
  }, [token]);

  const data = profile ?? user;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile settings</h1>
        <p className="mt-1 text-sm text-zinc-500">Your account information.</p>
      </div>

      <dl className="divide-y divide-zinc-100 rounded-xl border border-zinc-200">
        <div className="grid gap-1 p-4 sm:grid-cols-3">
          <dt className="text-sm font-medium text-zinc-500">Name</dt>
          <dd className="text-sm sm:col-span-2">{data?.name ?? '—'}</dd>
        </div>
        <div className="grid gap-1 p-4 sm:grid-cols-3">
          <dt className="text-sm font-medium text-zinc-500">Email</dt>
          <dd className="text-sm sm:col-span-2">{data?.email ?? '—'}</dd>
        </div>
        <div className="grid gap-1 p-4 sm:grid-cols-3">
          <dt className="text-sm font-medium text-zinc-500">Phone</dt>
          <dd className="text-sm sm:col-span-2">{profile?.phone ?? '—'}</dd>
        </div>
      </dl>
    </div>
  );
}
