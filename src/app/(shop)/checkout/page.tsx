'use client';

import { formatPrice } from '@/components/shop/product-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import type { Address, CheckoutPreview, Order } from '@/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CheckoutPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [preview, setPreview] = useState<CheckoutPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!token) return;
    apiFetch<Address[]>('/api/v1/address', { token })
      .then((data) => {
        setAddresses(data);
        const def = data.find((a) => a.isDefault) ?? data[0];
        if (def) setAddressId(def._id);
      })
      .catch(() => setAddresses([]));
  }, [token]);

  async function loadPreview() {
    if (!token) return;
    const data = await apiFetch<CheckoutPreview>('/api/v1/cart/checkout-preview', {
      method: 'POST',
      token,
      body: JSON.stringify({ couponCode: couponCode || undefined, currency: 'BDT' }),
    });
    setPreview(data);
  }

  useEffect(() => {
    if (token) loadPreview().catch(() => setPreview(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function placeOrder() {
    if (!token || !addressId || !preview) return;
    setLoading(true);
    setError('');
    try {
      const order = await apiFetch<Order>('/api/v1/order', {
        method: 'POST',
        token,
        body: JSON.stringify({
          items: preview.lines
            .filter((line) => line.isSelected)
            .map((line) => ({
              productId: line.productId,
              variantId: line.variantId,
              quantity: line.quantity,
            })),
          addressId,
          paymentMethod: 'cash_on_delivery',
          couponCode: couponCode || undefined,
          currency: 'BDT',
        }),
      });
      setSuccess(`Order ${order.orderNumber} placed successfully!`);
      setTimeout(() => router.push('/account/orders'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Order failed');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return <p>Please <a href="/login" className="underline">login</a> to checkout.</p>;
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Checkout</h1>

      <section className="space-y-3">
        <h2 className="font-medium">Shipping address</h2>
        {addresses.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No addresses. <a href="/account/addresses" className="underline">Add one</a>
          </p>
        ) : (
          <select
            value={addressId}
            onChange={(e) => setAddressId(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          >
            {addresses.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name} — {a.city}, {a.state}
              </option>
            ))}
          </select>
        )}
      </section>

      <section className="space-y-3">
        <Input
          label="Coupon code"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
        />
        <Button variant="secondary" onClick={() => loadPreview()}>
          Apply coupon
        </Button>
      </section>

      {preview ? (
        <div className="space-y-2 rounded-xl border border-zinc-200 p-4 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatPrice(preview.itemsSubtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Discount</span>
            <span>-{formatPrice(preview.coupon?.discountAmount ?? 0)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>{formatPrice(preview.totalAmount)}</span>
          </div>
        </div>
      ) : null}

      <p className="text-sm text-zinc-500">Payment: Cash on delivery</p>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-green-600">{success}</p> : null}

      <Button
        onClick={placeOrder}
        disabled={loading || !addressId || !preview}
        className="w-full"
      >
        {loading ? 'Placing order…' : 'Place order'}
      </Button>
    </div>
  );
}
