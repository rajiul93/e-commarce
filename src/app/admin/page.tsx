'use client';

import { formatPrice } from '@/components/shop/product-card';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { isAdminOrManager } from '@/lib/admin-access';
import { useAuthStore } from '@/stores/auth-store';
import type { DashboardAnalytics } from '@/types';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type Period = 'week' | 'month' | 'year';

const PERIOD_LABELS: Record<Period, string> = {
  week: 'Weekly',
  month: 'Monthly',
  year: 'Yearly',
};

function StatCard({
  label,
  value,
  hint,
  accent,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
  href?: string;
}) {
  const inner = (
    <>
      <p className="text-sm text-zinc-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ?? 'text-zinc-900'}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-zinc-400">{hint}</p> : null}
      {href ? <p className="mt-2 text-xs font-medium text-zinc-500">View details →</p> : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-400 hover:shadow-md"
      >
        {inner}
      </Link>
    );
  }

  return <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">{inner}</div>;
}

export default function AdminDashboardPage() {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const managerOrAdmin = isAdminOrManager(user?.role);
  const [period, setPeriod] = useState<Period>('month');

  const analytics = useQuery({
    queryKey: ['admin', 'analytics', period],
    queryFn: () =>
      apiFetch<DashboardAnalytics>('/api/v1/analytics/dashboard', {
        token,
        params: { period },
      }),
    enabled: !!token && managerOrAdmin,
  });

  const data = analytics.data;

  if (!managerOrAdmin) {
    return <p className="text-sm text-zinc-500">Dashboard is for admin and manager only.</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-zinc-500">Income, expense, sales and store overview</p>
        </div>
        <div className="flex rounded-lg border border-zinc-200 p-1">
          {(['week', 'month', 'year'] as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-md px-4 py-2 text-sm font-medium capitalize ${
                period === p ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {analytics.isLoading ? (
        <p className="text-sm text-zinc-500">Loading analytics…</p>
      ) : analytics.isError ? (
        <p className="text-sm text-red-600">Could not load dashboard data.</p>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Income (sales)"
              value={formatPrice(data.income)}
              hint={`${PERIOD_LABELS[period]} delivered orders`}
              accent="text-emerald-700"
              href={`/admin/income?period=${period}`}
            />
            <StatCard
              label="Expense"
              value={formatPrice(data.expense)}
              hint={`Manual ${formatPrice(data.manualExpense)} + product + staff`}
              accent="text-red-600"
              href={`/admin/expenses?period=${period}`}
            />
            <StatCard
              label="Profit"
              value={formatPrice(data.profit)}
              hint="Sales − expense"
              accent={data.profit >= 0 ? 'text-emerald-700' : 'text-red-600'}
            />
            <StatCard
              label="Running offers"
              value={String(data.runningOffers)}
              hint="Active products with offer"
              href="/admin/products"
            />
            <StatCard
              label="Active coupons"
              value={String(data.activeCoupons)}
              hint="Valid coupons now"
              href="/admin/coupons"
            />
            <StatCard
              label="Total users"
              value={String(data.totalUsers)}
              hint="Customers"
              href="/admin/users"
            />
            <StatCard
              label="Total staff"
              value={String(data.totalStaff)}
              hint="Managers + sellers"
              href="/admin/users"
            />
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold">Sales chart</h2>
                <p className="text-sm text-zinc-500">
                  {PERIOD_LABELS[period]} revenue from delivered orders
                </p>
              </div>
              <Link href={`/admin/income?period=${period}`}>
                <Button variant="secondary">View income</Button>
              </Link>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.salesChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#71717a' }}
                    interval={period === 'month' ? 4 : 0}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#71717a' }} width={56} />
                  <Tooltip
                    formatter={(value) => [
                      formatPrice(typeof value === 'number' ? value : Number(value) || 0),
                      'Sales',
                    ]}
                    labelFormatter={(label) => String(label)}
                  />
                  <Bar dataKey="sales" fill="#18181b" radius={[4, 4, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
