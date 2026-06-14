'use client';

import { ProductCard } from '@/components/shop/product-card';
import { apiFetch } from '@/lib/api';
import { useInvalidateShopCounts } from '@/hooks/use-shop-counts';
import { useAuthStore } from '@/stores/auth-store';
import type { Product } from '@/types';
import { useEffect, useState } from 'react';

type WishlistItem = {
  _id: string;
  productId: Product;
};

export default function WishlistPage() {
  const token = useAuthStore((s) => s.accessToken);
  const { invalidateWishlist } = useInvalidateShopCounts();
  const [items, setItems] = useState<WishlistItem[]>([]);

  function load() {
    if (!token) return;
    apiFetch<WishlistItem[]>('/api/v1/wishlist', { token }).then(setItems).catch(() => setItems([]));
  }

  useEffect(() => {
    if (!token) return;
    load();
  }, [token]);

  async function remove(id: string) {
    if (!token) return;
    await apiFetch(`/api/v1/wishlist/${id}`, { method: 'DELETE', token });
    await invalidateWishlist();
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Wishlist</h1>
      {items.length === 0 ? (
        <p className="text-zinc-500">Your wishlist is empty.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item._id} className="relative">
              <ProductCard product={item.productId} />
              <button
                type="button"
                onClick={() => remove(item._id)}
                className="absolute right-2 top-2 rounded bg-white/90 px-2 py-1 text-xs shadow"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
