'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  canAccessAdminPath,
  getAdminFallbackPath,
} from '@/lib/admin-access';
import { logoutSession } from '@/lib/auth-session';
import { useSessionReady } from '@/hooks/use-session-ready';
import { useAuthStore } from '@/stores/auth-store';

const adminLinks = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/attributes', label: 'Attributes' },
  { href: '/admin/variants', label: 'Variants' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/brands', label: 'Brands' },
  { href: '/admin/collections', label: 'Collections' },
  { href: '/admin/pos', label: 'POS' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/coupons', label: 'Coupons' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/settings', label: 'Settings' },
];

const sellerLinks = [
  { href: '/admin/pos', label: 'POS' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/profile', label: 'My profile' },
];

const STAFF_ROLES = ['ADMIN', 'MANAGER', 'SELLER'] as const;

function getNavLinks(role?: string) {
  if (role === 'ADMIN') {
    return [
      ...adminLinks.slice(0, -1),
      { href: '/admin/staff/payroll', label: 'Staff payroll' },
      adminLinks[adminLinks.length - 1],
    ];
  }
  if (role === 'MANAGER') {
    return adminLinks.filter((link) => link.href !== '/admin/settings');
  }
  if (role === 'SELLER') return sellerLinks;
  return sellerLinks;
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const sessionReady = useSessionReady();
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const isLogin = pathname === '/admin/login';
  const isStaff = user?.role && STAFF_ROLES.includes(user.role as (typeof STAFF_ROLES)[number]);
  const links = getNavLinks(user?.role);

  useEffect(() => {
    if (isLogin || !sessionReady) return;
    if (!token || !isStaff) {
      router.replace('/admin/login');
      return;
    }
    if (!canAccessAdminPath(pathname, user?.role)) {
      router.replace(getAdminFallbackPath(user?.role));
    }
  }, [sessionReady, token, isStaff, router, isLogin, pathname, user?.role]);

  if (isLogin) return <>{children}</>;

  if (!sessionReady) {
    return <p className="p-8 text-sm text-zinc-500">Loading…</p>;
  }

  if (!token || !isStaff) {
    return <p className="p-8">Checking access…</p>;
  }

  if (!canAccessAdminPath(pathname, user?.role)) {
    return <p className="p-8 text-sm text-zinc-500">Redirecting…</p>;
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-zinc-200 bg-zinc-50 p-4">
        <p className="mb-1 text-sm font-bold uppercase tracking-wide text-zinc-500">Admin</p>
        <p className="mb-6 text-xs capitalize text-zinc-400">{user?.role?.toLowerCase()}</p>
        <nav className="space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-lg px-3 py-2 text-sm ${
                pathname === link.href || (link.href !== '/admin' && pathname.startsWith(`${link.href}/`))
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 space-y-2 border-t border-zinc-200 pt-4 text-sm">
          <Link href="/" className="block text-zinc-600 hover:text-zinc-900">
            View store
          </Link>
          <button
            type="button"
            onClick={() => void logoutSession()}
            className="text-zinc-600 hover:text-zinc-900"
          >
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
