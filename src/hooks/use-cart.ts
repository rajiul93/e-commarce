'use client';

import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import type { Cart } from '@/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

const CART_QUERY_KEY = ['shop', 'cart'] as const;

export function useCart() {
  const token = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const [updatingLineId, setUpdatingLineId] = useState<string | null>(null);

  const cartQuery = useQuery({
    queryKey: [...CART_QUERY_KEY, token],
    queryFn: () => apiFetch<Cart>('/api/v1/cart', { token }),
    enabled: !!token,
  });

  const invalidateCart = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
  }, [queryClient]);

  const updateLineQuantity = useCallback(
    async (lineId: string, quantity: number) => {
      if (!token) return;
      setUpdatingLineId(lineId);
      try {
        if (quantity < 1) {
          await apiFetch(`/api/v1/cart/items/${lineId}`, { method: 'DELETE', token });
        } else {
          await apiFetch(`/api/v1/cart/items/${lineId}`, {
            method: 'PATCH',
            token,
            body: JSON.stringify({ quantity }),
          });
        }
        await invalidateCart();
      } finally {
        setUpdatingLineId(null);
      }
    },
    [token, invalidateCart],
  );

  const addToCart = useCallback(
    async (payload: {
      productId: string;
      variantId?: string;
      quantity?: number;
    }) => {
      if (!token) throw new Error('Login required');
      await apiFetch('/api/v1/cart/items', {
        method: 'POST',
        token,
        body: JSON.stringify({
          productId: payload.productId,
          variantId: payload.variantId,
          quantity: payload.quantity ?? 1,
        }),
      });
      await invalidateCart();
    },
    [token, invalidateCart],
  );

  const removeLine = useCallback(
    async (lineId: string) => {
      await updateLineQuantity(lineId, 0);
    },
    [updateLineQuantity],
  );

  const toggleLineSelected = useCallback(
    async (lineId: string, isSelected: boolean) => {
      if (!token) return;
      setUpdatingLineId(lineId);
      try {
        await apiFetch(`/api/v1/cart/items/${lineId}`, {
          method: 'PATCH',
          token,
          body: JSON.stringify({ isSelected }),
        });
        await invalidateCart();
      } finally {
        setUpdatingLineId(null);
      }
    },
    [token, invalidateCart],
  );

  const itemCount =
    cartQuery.data?.items.reduce((sum, line) => sum + line.quantity, 0) ?? 0;

  return {
    cart: cartQuery.data ?? null,
    isLoading: cartQuery.isLoading,
    isLoggedIn: !!token,
    itemCount,
    updatingLineId,
    invalidateCart,
    updateLineQuantity,
    addToCart,
    removeLine,
    toggleLineSelected,
  };
}
