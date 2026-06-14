'use client';

import { apiFetch } from '@/lib/api';
import { useInvalidateShopCounts } from '@/hooks/use-shop-counts';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = {
  productId: string;
  className?: string;
};

export function ProductCardWishlist({ productId, className = '' }: Props) {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const { invalidateWishlist } = useInvalidateShopCounts();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!token) {
      router.push('/login');
      return;
    }
    if (loading || saved) return;

    setLoading(true);
    try {
      await apiFetch('/api/v1/wishlist', {
        method: 'POST',
        token,
        body: JSON.stringify({ productId }),
      });
      await invalidateWishlist();
      setSaved(true);
    } catch {
      /* ignore — card stays usable */
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      aria-label={saved ? 'Saved to wishlist' : 'Add to wishlist'}
      onClick={handleClick}
      disabled={loading}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-zinc-700 shadow-md ring-1 ring-zinc-950/5 backdrop-blur-sm transition hover:scale-105 hover:text-rose-600 disabled:cursor-default ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className={`h-4 w-4 ${saved ? 'fill-rose-500 text-rose-500' : 'fill-none'}`}
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 0 1 6.364 0L12 7.636l1.318-1.318a4.5 4.5 0 1 1 6.364 6.364L12 21.364l-7.682-7.682a4.5 4.5 0 0 1 0-6.364z"
        />
      </svg>
    </button>
  );
}
