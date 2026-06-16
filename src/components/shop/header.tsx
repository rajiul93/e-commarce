'use client';

import Link from 'next/link';
import Image from 'next/image';
import { CartIcon, NavIconLink, WishlistIcon } from '@/components/shop/nav-icon-link';
import { useCartCount, useWishlistCount } from '@/hooks/use-shop-counts';
import { apiFetch } from '@/lib/api';
import { logoutSession } from '@/lib/auth-session';
import { SHOP_NAV_LINKS } from '@/lib/shop-nav';
import { SITE_NAME } from '@/lib/site-config';
import { useAuthStore } from '@/stores/auth-store';
import type { BrandingSettings } from '@/types';
import { useQuery } from '@tanstack/react-query';

type ShopHeaderProps = {
  initialBranding?: BrandingSettings | null;
};

export function ShopHeader({ initialBranding }: ShopHeaderProps) {
  const user = useAuthStore((s) => s.user);
  const { count: cartCount, isLoggedIn: cartLoggedIn } = useCartCount();
  const { count: wishlistCount, isLoggedIn: wishlistLoggedIn } = useWishlistCount();

  const { data: branding } = useQuery({
    queryKey: ['branding'],
    queryFn: () => apiFetch<BrandingSettings>('/api/v1/settings/branding'),
    initialData: initialBranding ?? undefined,
    staleTime: 60_000,
  });

  const siteName = branding?.siteName?.trim() || SITE_NAME;
  const logo = branding?.logo;

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="flex min-h-10 min-w-0 items-center transition hover:opacity-80"
          aria-label={siteName}
        >
          {logo?.url ? (
            <span className="relative block h-9 w-32 max-w-[min(8rem,40vw)] shrink-0">
              <Image
                src={logo.url}
                alt={logo.alt || siteName}
                fill
                className="object-contain object-left"
                sizes="(max-width: 640px) 40vw, 128px"
                priority
                unoptimized
              />
            </span>
          ) : (
            <span className="text-xl font-bold tracking-tight text-zinc-900">{siteName}</span>
          )}
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {SHOP_NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 xl:px-4"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <nav className="hidden items-center gap-0.5 sm:flex lg:hidden">
          <Link
            href="/products"
            className="rounded-full px-3 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
          >
            Products
          </Link>
          <Link
            href="/about-us"
            className="rounded-full px-3 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
          >
            About
          </Link>
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <NavIconLink
            href="/account/wishlist"
            label="Wishlist"
            count={wishlistCount}
            showCount={wishlistLoggedIn}
          >
            <WishlistIcon />
          </NavIconLink>

          <NavIconLink
            href="/account/cart"
            label="Cart"
            count={cartCount}
            showCount={cartLoggedIn}
          >
            <CartIcon />
          </NavIconLink>

          {user ? (
            <>
              <Link
                href="/account"
                className="hidden rounded-full px-3 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 sm:inline"
              >
                Account
              </Link>
              {user.role === 'ADMIN' ? (
                <Link
                  href="/admin"
                  className="hidden rounded-full px-3 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100 sm:inline"
                >
                  Admin
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => void logoutSession()}
                className="rounded-full px-3 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-full px-3 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 sm:inline"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="hidden rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 sm:inline"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
