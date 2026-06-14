'use client';

import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import type { Cart } from '@/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';

type WishlistRow = { _id: string };

export function useCartCount() {
  const token = useAuthStore((s) => s.accessToken);
  const query = useQuery({
    queryKey: ['shop', 'cart', token],
    queryFn: () => apiFetch<Cart>('/api/v1/cart', { token }),
    enabled: !!token,
  });
  const count =
    query.data?.items.reduce((sum, line) => sum + line.quantity, 0) ?? 0;
  return { count, isLoading: query.isLoading, isLoggedIn: !!token };
}

export function useWishlistCount() {
  const token = useAuthStore((s) => s.accessToken);
  const query = useQuery({
    queryKey: ['shop', 'wishlist', token],
    queryFn: () => apiFetch<WishlistRow[]>('/api/v1/wishlist', { token }),
    enabled: !!token,
  });
  return { count: query.data?.length ?? 0, isLoading: query.isLoading, isLoggedIn: !!token };
}

export function useInvalidateShopCounts() {
  const queryClient = useQueryClient();
  return {
    invalidateCart: () => queryClient.invalidateQueries({ queryKey: ['shop', 'cart'] }),
    invalidateWishlist: () =>
      queryClient.invalidateQueries({ queryKey: ['shop', 'wishlist'] }),
  };
}
