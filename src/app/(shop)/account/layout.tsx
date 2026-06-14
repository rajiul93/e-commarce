'use client';

import { AccountSidebar } from '@/components/shop/account-sidebar';
import { useAuthHydrated, useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.accessToken);
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (!token) router.push('/login');
  }, [hydrated, token, router]);

  if (!hydrated) {
    return <p className="text-sm text-zinc-500">Loading…</p>;
  }

  if (!token) return null;

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <aside className="w-full shrink-0 lg:sticky lg:top-8 lg:w-56">
        <AccountSidebar />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
