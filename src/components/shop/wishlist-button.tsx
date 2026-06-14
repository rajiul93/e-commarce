'use client';

import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { useInvalidateShopCounts } from '@/hooks/use-shop-counts';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function WishlistButton({ productId }: { productId: string }) {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const { invalidateWishlist } = useInvalidateShopCounts();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleClick() {
    if (!token) {
      router.push('/login');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      await apiFetch('/api/v1/wishlist', {
        method: 'POST',
        token,
        body: JSON.stringify({ productId }),
      });
      await invalidateWishlist();
      setMessage('Added to wishlist');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button variant="secondary" onClick={handleClick} disabled={loading}>
        {loading ? 'Saving…' : 'Add to wishlist'}
      </Button>
      {message ? <p className="mt-2 text-sm text-zinc-500">{message}</p> : null}
    </div>
  );
}
