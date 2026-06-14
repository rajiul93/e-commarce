'use client';

import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import type { UserProfile } from '@/types';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AccountPage() {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!token) return;
    apiFetch<UserProfile>('/api/v1/user/me', { token })
      .then(setProfile)
      .catch(() => setProfile(null));
  }, [token]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Welcome back, {profile?.name ?? user?.name ?? 'there'}.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 p-4">
        <p className="font-medium">{profile?.name ?? user?.name}</p>
        <p className="text-sm text-zinc-500">{profile?.email ?? user?.email}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/account/orders"
          className="rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50"
        >
          <p className="font-medium">Orders</p>
          <p className="text-sm text-zinc-500">View order history</p>
        </Link>
        <Link
          href="/account/addresses"
          className="rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50"
        >
          <p className="font-medium">Addresses</p>
          <p className="text-sm text-zinc-500">Manage delivery addresses</p>
        </Link>
      </div>
    </div>
  );
}
