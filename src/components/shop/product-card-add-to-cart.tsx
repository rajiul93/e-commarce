'use client';

import { apiFetch } from '@/lib/api';
import { useInvalidateShopCounts } from '@/hooks/use-shop-counts';
import { useAuthStore } from '@/stores/auth-store';
import type { Product } from '@/types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = {
  productId: string;
  slug: string;
  inStock: boolean;
  className?: string;
};

export function ProductCardAddToCart({ productId, slug, inStock, className = '' }: Props) {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const { invalidateCart } = useInvalidateShopCounts();
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock || loading) return;

    if (!token) {
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      const detail = await apiFetch<Product & { variants?: Product['variants'] }>(
        `/api/v1/product/by-slug/${slug}`,
      );
      const variants = (detail.variants ?? []).filter(
        (v) => v.status === 'active' && v.stock > 0,
      );

      if (variants.length === 0) return;

      if (variants.length > 1) {
        router.push(`/products/${slug}`);
        return;
      }

      await apiFetch('/api/v1/cart/items', {
        method: 'POST',
        token,
        body: JSON.stringify({
          productId,
          variantId: variants[0]._id,
          quantity: 1,
        }),
      });
      await invalidateCart();
      setAdded(true);
      window.setTimeout(() => setAdded(false), 2000);
    } catch {
      router.push(`/products/${slug}`);
    } finally {
      setLoading(false);
    }
  }

  if (!inStock) {
    return (
      <button
        type="button"
        disabled
        className={`w-full rounded-xl bg-zinc-100 py-2.5 text-xs font-semibold text-zinc-400 ${className}`}
      >
        Out of stock
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`w-full py-2.5 text-xs font-semibold transition ${className} ${
        added
          ? 'bg-emerald-600 text-white'
          : 'bg-primary text-primary-foreground hover:bg-primary/70 disabled:opacity-60'
      }`}
    >
      {loading ? 'Adding…' : added ? 'Added ✓' : 'Add to cart'}
    </button>
  );
}
