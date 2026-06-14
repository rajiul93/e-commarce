'use client';

import { formatPrice } from '@/components/shop/product-card';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { isAdminOrManager } from '@/lib/admin-access';
import { useAuthStore } from '@/stores/auth-store';
import type { Order } from '@/types';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

type Period = 'week' | 'month' | 'year';

const PERIOD_LABELS: Record<Period, string> = {
  week: 'Weekly',
  month: 'Monthly',
  year: 'Yearly',
};

export default function AdminIncomePage() {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const searchParams = useSearchParams();
  const period = (searchParams.get('period') as Period) || 'month';
  const managerOrAdmin = isAdminOrManager(user?.role);

  const orders = useQuery({
    queryKey: ['admin', 'income', period],
    queryFn: () =>
      apiFetch<Order[]>('/api/v1/analytics/income', { token, params: { period } }),
    enabled: !!token && managerOrAdmin,
  });

  const total = (orders.data ?? []).reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);

  if (!managerOrAdmin) {
    return <p className="text-sm text-zinc-500">Access denied.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-900">
            ← Dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-bold">Income</h1>
          <p className="text-sm text-zinc-500">
            Delivered orders — {PERIOD_LABELS[period] ?? period} view
          </p>
        </div>
        <div className="flex gap-2">
          {(['week', 'month', 'year'] as Period[]).map((p) => (
            <Link key={p} href={`/admin/income?period=${p}`}>
              <Button variant={period === p ? 'primary' : 'secondary'}>{PERIOD_LABELS[p]}</Button>
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <p className="text-sm text-emerald-800">Total income</p>
        <p className="text-2xl font-bold text-emerald-900">{formatPrice(total)}</p>
        <p className="text-xs text-emerald-700">{(orders.data ?? []).length} delivered order(s)</p>
      </div>

      {orders.isLoading ? (
        <p>Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="p-3">Order</th>
                <th className="p-3">Date</th>
                <th className="p-3">Channel</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Items</th>
                <th className="p-3">Total</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {(orders.data ?? []).map((order) => (
                <tr key={order._id} className="border-b border-zinc-100">
                  <td className="p-3 font-medium">{order.orderNumber}</td>
                  <td className="p-3 text-zinc-600">
                    {order.createdAt ? new Date(order.createdAt).toLocaleString() : '—'}
                  </td>
                  <td className="p-3 capitalize">{order.channel ?? 'online'}</td>
                  <td className="p-3 capitalize">
                    {order.paymentMethod} · {order.paymentStatus}
                  </td>
                  <td className="p-3">{(order.items ?? []).length}</td>
                  <td className="p-3 font-semibold">{formatPrice(order.totalAmount)}</td>
                  <td className="p-3">
                    <Link
                      href={`/admin/orders`}
                      className="text-xs font-medium underline-offset-2 hover:underline"
                    >
                      Orders
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(orders.data ?? []).length === 0 ? (
            <p className="p-6 text-center text-zinc-500">No delivered orders in this period.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
