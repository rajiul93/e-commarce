'use client';

import { AdminBrandingSettings } from '@/components/admin/admin-branding-settings';
import { AdminHomeHeroSettings } from '@/components/admin/admin-home-hero-settings';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import type { OrderSettings } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

const sections = [
  { id: 'branding', label: 'Logo' },
  { id: 'order', label: 'Order settings' },
  { id: 'home-hero', label: 'Home hero' },
] as const;

type SectionId = (typeof sections)[number]['id'];

export default function AdminSettingsPage() {
  const token = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const [section, setSection] = useState<SectionId>('branding');
  const [form, setForm] = useState<OrderSettings>({
    loggedInCheckout: true,
    guestQuickOrder: true,
    couponScope: 'all_products',
  });
  const [message, setMessage] = useState('');

  const settings = useQuery({
    queryKey: ['admin', 'settings', 'order'],
    queryFn: () => apiFetch<OrderSettings>('/api/v1/settings/order', { token }),
    enabled: !!token,
  });

  useEffect(() => {
    if (settings.data) setForm(settings.data);
  }, [settings.data]);

  const save = useMutation({
    mutationFn: (body: OrderSettings) =>
      apiFetch<OrderSettings>('/api/v1/settings/order', {
        method: 'PATCH',
        token,
        body: JSON.stringify(body),
      }),
    onSuccess: (data) => {
      setForm(data);
      setMessage('Settings saved');
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings', 'order'] });
    },
    onError: (err: Error) => {
      setMessage(err.message);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.loggedInCheckout && !form.guestQuickOrder) {
      setMessage('At least one order mode must stay enabled');
      return;
    }
    setMessage('');
    save.mutate(form);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-zinc-500">Configure logo, orders, and home page.</p>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Section</span>
        <select
          value={section}
          onChange={(e) => setSection(e.target.value as SectionId)}
          className="w-full max-w-xs rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        >
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>

      {section === 'order' ? (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-zinc-200 p-4">
          <h2 className="font-medium">Order settings</h2>
          <p className="text-sm text-zinc-500">
            Choose how customers can place orders. You can enable one or both modes.
          </p>

          {settings.isLoading ? <p className="text-sm text-zinc-500">Loading…</p> : null}

          <label className="flex items-start gap-3 rounded-lg border border-zinc-200 p-3">
            <input
              type="checkbox"
              checked={form.loggedInCheckout}
              onChange={(e) => setForm({ ...form, loggedInCheckout: e.target.checked })}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium">Logged-in checkout</span>
              <span className="block text-xs text-zinc-500">
                Customer logs in, uses saved address via cart and checkout. Both admin and
                customer can track the order.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-lg border border-zinc-200 p-3">
            <input
              type="checkbox"
              checked={form.guestQuickOrder}
              onChange={(e) => setForm({ ...form, guestQuickOrder: e.target.checked })}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium">Guest quick order</span>
              <span className="block text-xs text-zinc-500">
                Order button on product page opens a form (name, phone, division, jela, thana,
                local location). Only admin can track these orders.
              </span>
            </span>
          </label>

          <div className="space-y-2 rounded-lg border border-zinc-200 p-3">
            <p className="text-sm font-medium">Coupon apply scope</p>
            <p className="text-xs text-zinc-500">
              Choose whether coupons apply to all products or only selected products per coupon.
            </p>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="couponScope"
                checked={form.couponScope === 'all_products'}
                onChange={() => setForm({ ...form, couponScope: 'all_products' })}
              />
              All products
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="couponScope"
                checked={form.couponScope === 'specific_products'}
                onChange={() => setForm({ ...form, couponScope: 'specific_products' })}
              />
              Specific products only (pick products when creating each coupon)
            </label>
          </div>

          {message ? (
            <p className={`text-sm ${save.isError ? 'text-red-600' : 'text-green-600'}`}>
              {message}
            </p>
          ) : null}

          <Button type="submit" disabled={save.isPending || settings.isLoading}>
            {save.isPending ? 'Saving…' : 'Save order settings'}
          </Button>
        </form>
      ) : null}

      {section === 'branding' ? (
        <div className="max-w-2xl">
          <AdminBrandingSettings />
        </div>
      ) : null}

      {section === 'home-hero' ? (
        <div className="max-w-3xl">
          <AdminHomeHeroSettings />
        </div>
      ) : null}
    </div>
  );
}
