'use client';

import { formatPrice } from '@/components/shop/product-card';
import { apiFetch } from '@/lib/api';
import { formatPayrollMonth } from '@/lib/staff-payroll';
import { useAuthStore } from '@/stores/auth-store';
import type { StaffPayroll, UserProfile } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

type MyPayrollProfile = {
  staff: UserProfile;
  records: StaffPayroll[];
  averageRating: number | null;
  totalEarned: number;
  totalBonus: number;
};

function StarRating({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5 text-amber-500" aria-label={`Rating ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= value ? 'opacity-100' : 'opacity-25'}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function StaffProfilePage() {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== 'MANAGER' && user.role !== 'SELLER') {
      router.replace('/admin');
    }
  }, [user, router]);

  const profile = useQuery({
    queryKey: ['staff', 'profile', 'payroll'],
    queryFn: () => apiFetch<MyPayrollProfile>('/api/v1/staff/payroll/me', { token }),
    enabled: !!token && (user?.role === 'MANAGER' || user?.role === 'SELLER'),
  });

  const data = profile.data;
  const staff = data?.staff;

  if (user && user.role !== 'MANAGER' && user.role !== 'SELLER') {
    return <p className="text-sm text-zinc-500">Redirecting…</p>;
  }

  if (profile.isLoading) {
    return <p>Loading profile…</p>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">My profile</h1>
        <p className="text-sm text-zinc-500">Your salary, bonus and work performance</p>
      </div>

      {staff ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-zinc-200 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Name</p>
            <p className="mt-1 font-semibold">{staff.name}</p>
            <p className="text-sm text-zinc-500">{staff.email}</p>
            <p className="mt-1 text-xs capitalize text-zinc-400">{staff.role.toLowerCase()}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Total earned</p>
            <p className="mt-1 text-xl font-bold">{formatPrice(data?.totalEarned ?? 0)}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Total bonus</p>
            <p className="mt-1 text-xl font-bold text-emerald-700">
              {formatPrice(data?.totalBonus ?? 0)}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Work rating</p>
            {data?.averageRating != null ? (
              <div className="mt-2 flex items-center gap-2">
                <StarRating value={Math.round(data.averageRating)} />
                <span className="text-sm font-medium">{data.averageRating}/5 avg</span>
              </div>
            ) : (
              <p className="mt-2 text-sm text-zinc-400">Not rated yet</p>
            )}
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <h2 className="font-semibold">Monthly salary history</h2>
        {(data?.records.length ?? 0) === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">
            No salary records yet. Admin will add your monthly payroll.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50">
                <tr>
                  <th className="p-3">Month</th>
                  <th className="p-3">Present</th>
                  <th className="p-3">Base pay</th>
                  <th className="p-3">Bonus</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Rating</th>
                </tr>
              </thead>
              <tbody>
                {(data?.records ?? []).map((row) => (
                  <tr key={row._id} className="border-b border-zinc-100">
                    <td className="p-3 font-medium">{formatPayrollMonth(row.year, row.month)}</td>
                    <td className="p-3">
                      {row.presentDays}/{row.workingDaysInMonth} days
                    </td>
                    <td className="p-3">{formatPrice(row.calculatedPay)}</td>
                    <td className="p-3">
                      {row.bonusAmount > 0 ? (
                        <span>
                          {formatPrice(row.bonusAmount)}
                          {row.bonusType === 'percent' && row.bonusValue != null
                            ? ` (${row.bonusValue}%)`
                            : ''}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-3 font-semibold">
                      {formatPrice(row.totalPay ?? row.calculatedPay)}
                    </td>
                    <td className="p-3">
                      {row.workRating != null ? (
                        <StarRating value={row.workRating} />
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
