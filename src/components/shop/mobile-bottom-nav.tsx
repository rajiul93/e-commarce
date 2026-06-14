'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CartIcon } from '@/components/shop/nav-icon-link';
import { useCartCount } from '@/hooks/use-shop-counts';
import { useAuthStore } from '@/stores/auth-store';

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  match: (pathname: string) => boolean;
  badge?: number;
};

function HomeIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z"
      />
    </svg>
  );
}

function ShopIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16l-1.2 9H5.2L4 7z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 11V7a3 3 0 0 1 6 0v4" />
    </svg>
  );
}

function AccountIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.75}>
      <circle cx="12" cy="8" r="3.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 20c0-3.314 3.134-6 7-6s7 2.686 7 6" />
    </svg>
  );
}

function ProfileIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.75}>
      <circle cx="12" cy="8" r="3.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 19.5c.94-2.485 3.015-4 5.5-4s4.56 1.515 5.5 4" />
    </svg>
  );
}

function BottomNavItem({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-label={item.badge ? `${item.label} (${item.badge})` : item.label}
      aria-current={active ? 'page' : undefined}
      className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-2 py-2 transition ${
        active ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'
      }`}
    >
      <span className={`relative ${active ? 'scale-105' : ''}`}>
        {item.icon}
        {item.badge && item.badge > 0 ? (
          <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-900 px-1 text-[9px] font-bold text-white">
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        ) : null}
      </span>
      <span className={`text-[11px] font-medium ${active ? 'font-semibold' : ''}`}>{item.label}</span>
      {active ? <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-zinc-900" /> : null}
    </Link>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const { count: cartCount } = useCartCount();
  const isLoggedIn = !!user;

  const guestItems: NavItem[] = [
    {
      href: '/',
      label: 'Home',
      icon: <HomeIcon />,
      match: (path) => path === '/',
    },
    {
      href: '/products',
      label: 'Shop',
      icon: <ShopIcon />,
      match: (path) => path === '/products' || path.startsWith('/products/'),
    },
    {
      href: '/login',
      label: 'Account',
      icon: <AccountIcon />,
      match: (path) => path === '/login' || path === '/register',
    },
  ];

  const loggedInItems: NavItem[] = [
    {
      href: '/',
      label: 'Home',
      icon: <HomeIcon />,
      match: (path) => path === '/',
    },
    {
      href: '/products',
      label: 'Shop',
      icon: <ShopIcon />,
      match: (path) => path === '/products' || path.startsWith('/products/'),
    },
    {
      href: '/account/cart',
      label: 'Cart',
      icon: <CartIcon className="h-6 w-6" />,
      match: (path) => path === '/account/cart',
      badge: cartCount,
    },
    {
      href: '/account',
      label: 'Profile',
      icon: <ProfileIcon />,
      match: (path) =>
        path === '/account' ||
        (path.startsWith('/account/') && path !== '/account/cart'),
    },
  ];

  const items = isLoggedIn ? loggedInItems : guestItems;

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200/90 bg-white/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="mx-auto flex h-16 max-w-lg items-stretch justify-around">
        {items.map((item) => (
          <BottomNavItem key={item.href} item={item} active={item.match(pathname)} />
        ))}
      </div>
    </nav>
  );
}
