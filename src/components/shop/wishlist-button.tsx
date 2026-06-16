'use client';

import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { useInvalidateShopCounts } from '@/hooks/use-shop-counts';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function WishlistButton({
  productId,
  className = '',
  onMessage,
}: {
  productId: string;
  className?: string;
  onMessage?: (message: string) => void;
}) {
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
      const text = 'Added to wishlist';
      setMessage(text);
      onMessage?.(text);
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Failed';
      setMessage(text);
      onMessage?.(text);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="secondary" onClick={handleClick} disabled={loading} className={className}>
        {loading ? (
          '…'
        ) : (
          <>
            <span className="sm:hidden">Wishlist</span>
            <span className="hidden sm:inline">Add to wishlist</span>
          </>
        )}
      </Button>
      {message && !onMessage ? <p className="mt-2 text-sm text-zinc-500">{message}</p> : null}
    </>
  );
}
