'use client';

import { StaffPayrollDialog } from '@/components/admin/staff-payroll-dialog';
import { formatPrice } from '@/components/shop/product-card';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { formatPayrollMonth, MONTH_NAMES } from '@/lib/staff-payroll';
import { useAuthStore } from '@/stores/auth-store';
import type { StaffPayroll, StaffSettings, UserProfile } from '@/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo, useState } from 'react';

type DialogTarget = {
  staff: UserProfile;
  existing?: StaffPayroll;
};

export default function StaffPayrollPage() {
  const token = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [dialogTarget, setDialogTarget] = useState<DialogTarget | null>(null);

  const staffSettings = useQuery({
    queryKey: ['admin', 'settings', 'staff'],
    queryFn: () => apiFetch<StaffSettings>('/api/v1/settings/staff', { token }),
    enabled: !!token,
  });

  const staff = useQuery({
    queryKey: ['admin', 'staff'],
    queryFn: () => apiFetch<UserProfile[]>('/api/v1/user/staff', { token }),
    enabled: !!token,
  });

  const payroll = useQuery({
    queryKey: ['admin', 'payroll', year, month],
    queryFn: () =>
      apiFetch<StaffPayroll[]>('/api/v1/staff/payroll', {
        token,
        params: { year, month },
      }),
    enabled: !!token,
  });

  const defaultWorkingDays = staffSettings.data?.workingDaysPerMonth ?? 26;

  const payrollByUserId = useMemo(() => {
    const map = new Map<string, StaffPayroll>();
    for (const row of payroll.data ?? []) {
      const id = typeof row.userId === 'object' ? row.userId._id : String(row.userId);
      map.set(id, row);
    }
    return map;
  }, [payroll.data]);

  const staffList = (staff.data ?? []).filter((s) => ['MANAGER', 'SELLER'].includes(s.role));

  function openCreateDialog(member: UserProfile) {
    setDialogTarget({ staff: member, existing: payrollByUserId.get(member._id) });
  }

  function handleSaved() {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'payroll', year, month] });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Staff payroll</h1>
        <p className="text-sm text-zinc-500">
          Create one salary record per staff member per month
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-zinc-200 p-4">
        <label className="space-y-1 text-sm">
          <span className="font-medium">Month</span>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded-lg border border-zinc-300 px-3 py-2"
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Year</span>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-28 rounded-lg border border-zinc-300 px-3 py-2"
          />
        </label>
        <p className="text-sm text-zinc-500">
          Working days default: <strong>{defaultWorkingDays}</strong>
        </p>
      </div>

      {staff.isLoading || payroll.isLoading ? (
        <p>Loading…</p>
      ) : staffList.length === 0 ? (
        <p className="text-zinc-500">No staff members yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Base salary</th>
                <th className="p-3">{formatPayrollMonth(year, month)}</th>
                <th className="p-3">Total paid</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((member) => {
                const current = payrollByUserId.get(member._id);
                return (
                  <tr key={member._id} className="border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="p-3 font-medium">{member.name}</td>
                    <td className="p-3 text-zinc-600">{member.email}</td>
                    <td className="p-3">{member.role}</td>
                    <td className="p-3">
                      {formatPrice(member.monthlySalary ?? current?.monthlySalary ?? 0)}
                    </td>
                    <td className="p-3">
                      {current ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                          {current.presentDays}/{current.workingDaysInMonth} days · Recorded
                        </span>
                      ) : (
                        <span className="text-zinc-400">Not recorded</span>
                      )}
                    </td>
                    <td className="p-3 font-medium">
                      {current ? formatPrice(current.totalPay ?? current.calculatedPay) : '—'}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant={current ? 'secondary' : 'primary'}
                          className="text-xs"
                          onClick={() => openCreateDialog(member)}
                        >
                          {current ? 'Edit salary' : 'Create salary'}
                        </Button>
                        <Link
                          href={`/admin/staff/payroll/${member._id}`}
                          className="text-xs text-zinc-500 underline-offset-2 hover:underline"
                        >
                          History
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {dialogTarget ? (
        <StaffPayrollDialog
          open
          onClose={() => setDialogTarget(null)}
          staff={dialogTarget.staff}
          year={year}
          month={month}
          defaultWorkingDays={defaultWorkingDays}
          existing={dialogTarget.existing}
          onSaved={handleSaved}
        />
      ) : null}
    </div>
  );
}
