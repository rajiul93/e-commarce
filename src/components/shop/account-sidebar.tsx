'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/account', label: 'Overview', exact: true },
  { href: '/account/cart', label: 'Cart', exact: true },
  { href: '/account/wishlist', label: 'Wishlist' },
  { href: '/account/orders', label: 'Orders' },
  { href: '/account/addresses', label: 'Addresses' },
  { href: '/account/settings', label: 'Profile settings' },
] as const;

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AccountSidebar() {
  const pathname = usePathname();

  return (
    <nav className="rounded-xl border border-zinc-200 bg-white p-2">
      <p className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-zinc-400">
        My account
      </p>
      <ul className="space-y-0.5">
        {links.map((link) => {
          const active = isActive(pathname, link.href, 'exact' in link ? link.exact : false);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-zinc-900 font-medium text-white'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
