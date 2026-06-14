'use client';

import { formatPrice } from '@/components/shop/product-card';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import type { Cart, CartLine, Product, Variant } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

function lineTitle(line: CartLine) {
  const product = line.productId as Product;
  return typeof product === 'object' ? product.title : 'Product';
}

function linePrice(line: CartLine) {
  const variant = line.variantId as Variant | undefined;
  return typeof variant === 'object' ? variant.price : 0;
}

export default function AccountCartPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCart = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiFetch<Cart>('/api/v1/cart', { token });
      setCart(data);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    loadCart();
  }, [token, loadCart]);

  async function updateLine(lineId: string, patch: { quantity?: number; isSelected?: boolean }) {
    if (!token) return;
    await apiFetch(`/api/v1/cart/items/${lineId}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(patch),
    });
    loadCart();
  }

  async function removeLine(lineId: string) {
    if (!token) return;
    await apiFetch(`/api/v1/cart/items/${lineId}`, { method: 'DELETE', token });
    loadCart();
  }

  if (loading) return <p>Loading cart…</p>;

  const items = cart?.items ?? [];
  const subtotal = items
    .filter((i) => i.isSelected)
    .reduce((sum, line) => sum + linePrice(line) * line.quantity, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Shopping cart</h1>
      {items.length === 0 ? (
        <div className="space-y-4">
          <p className="text-zinc-500">Your cart is empty.</p>
          <Link href="/products" className="text-zinc-900 underline">
            Continue shopping
          </Link>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200">
            {items.map((line) => (
              <li key={line._id} className="flex flex-wrap items-center gap-4 p-4">
                <input
                  type="checkbox"
                  checked={line.isSelected}
                  onChange={(e) => updateLine(line._id, { isSelected: e.target.checked })}
                />
                <div className="flex-1">
                  <p className="font-medium">{lineTitle(line)}</p>
                  <p className="text-sm text-zinc-500">{formatPrice(linePrice(line))} each</p>
                </div>
                <input
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={(e) => updateLine(line._id, { quantity: Number(e.target.value) })}
                  className="w-16 rounded border border-zinc-300 px-2 py-1 text-sm"
                />
                <Button variant="ghost" onClick={() => removeLine(line._id)}>
                  Remove
                </Button>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-4">
            <span className="font-medium">Selected subtotal</span>
            <span className="text-lg font-bold">{formatPrice(subtotal)}</span>
          </div>
          <Button onClick={() => router.push('/checkout')}>Proceed to checkout</Button>
        </>
      )}
    </div>
  );
}
