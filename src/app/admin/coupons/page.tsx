'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import type { Coupon, OrderSettings, Product } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

const emptyForm = () => ({
  code: '',
  type: 'fixed' as 'fixed' | 'percent',
  value: 0,
  currency: 'BDT',
  minOrderAmount: 0,
  expiresAt: '',
  isActive: true,
  productIds: [] as string[],
});

function formatExpiry(iso?: string) {
  if (!iso) return 'No expiry';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'No expiry';
  return d.toLocaleString();
}

function isExpired(iso?: string) {
  if (!iso) return false;
  return new Date(iso) <= new Date();
}

export default function AdminCouponsPage() {
  const token = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm());

  const coupons = useQuery({
    queryKey: ['admin', 'coupons'],
    queryFn: () => apiFetch<Coupon[]>('/api/v1/coupon', { token }),
    enabled: !!token,
  });

  const orderSettings = useQuery({
    queryKey: ['admin', 'settings', 'order'],
    queryFn: () => apiFetch<OrderSettings>('/api/v1/settings/order', { token }),
    enabled: !!token,
  });

  const products = useQuery({
    queryKey: ['admin', 'products', 'all'],
    queryFn: () => apiFetch<Product[]>('/api/v1/product/admin/all', { token }),
    enabled: !!token && orderSettings.data?.couponScope === 'specific_products',
  });

  const createCoupon = useMutation({
    mutationFn: () =>
      apiFetch('/api/v1/coupon/create', {
        method: 'POST',
        token,
        body: JSON.stringify({
          code: form.code,
          discountType: form.type,
          discountValue: form.value,
          currency: form.currency,
          minOrderAmount: form.minOrderAmount || undefined,
          expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
          isActive: form.isActive,
          ...(form.productIds.length ? { productIds: form.productIds } : {}),
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      setForm(emptyForm());
    },
  });

  const deleteCoupon = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/v1/coupon/${id}`, { method: 'DELETE', token }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Coupons</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          createCoupon.mutate();
        }}
        className="grid gap-4 rounded-xl border border-zinc-200 p-4 sm:grid-cols-3"
      >
        <Input
          label="Code"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          required
        />
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Type</span>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as 'fixed' | 'percent' })}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="fixed">Fixed</option>
            <option value="percent">Percent</option>
          </select>
        </label>
        <Input
          label="Value"
          type="number"
          value={form.value}
          onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
          required
        />
        <Input
          label="Min order"
          type="number"
          value={form.minOrderAmount}
          onChange={(e) => setForm({ ...form, minOrderAmount: Number(e.target.value) })}
        />
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Expire date</span>
          <input
            type="datetime-local"
            value={form.expiresAt}
            onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          Active
        </label>

        {orderSettings.data?.couponScope === 'specific_products' ? (
          <div className="sm:col-span-3">
            <p className="mb-2 text-sm font-medium">Apply to products</p>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-zinc-200 p-2">
              {(products.data ?? []).map((p) => (
                <label key={p._id} className="flex items-center gap-2 py-1 text-sm">
                  <input
                    type="checkbox"
                    checked={form.productIds.includes(p._id)}
                    onChange={(e) => {
                      setForm((prev) => ({
                        ...prev,
                        productIds: e.target.checked
                          ? [...prev.productIds, p._id]
                          : prev.productIds.filter((id) => id !== p._id),
                      }));
                    }}
                  />
                  {p.title}
                </label>
              ))}
            </div>
          </div>
        ) : null}

        <Button type="submit" disabled={createCoupon.isPending} className="sm:col-span-3">
          Create coupon
        </Button>
      </form>

      <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200">
        {(coupons.data ?? []).map((c) => (
          <li key={c._id} className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="font-medium">{c.code}</p>
              <p className="text-sm text-zinc-500">
                {c.discountType} {c.discountValue} · {c.isActive ? 'active' : 'inactive'}
              </p>
              <p className={`text-xs ${isExpired(c.expiresAt) ? 'text-red-600' : 'text-zinc-400'}`}>
                Expires: {formatExpiry(c.expiresAt)}
                {isExpired(c.expiresAt) ? ' (expired)' : ''}
              </p>
              {Array.isArray(c.productIds) && c.productIds.length > 0 ? (
                <p className="text-xs text-zinc-400">
                  Products:{' '}
                  {c.productIds
                    .map((p) => (typeof p === 'string' ? p : p.title))
                    .join(', ')}
                </p>
              ) : null}
            </div>
            <Button variant="danger" onClick={() => deleteCoupon.mutate(c._id)}>
              Delete
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
