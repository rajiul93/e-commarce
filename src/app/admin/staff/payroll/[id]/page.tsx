'use client';

import { formatPrice } from '@/components/shop/product-card';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import {
  calcTotalPay,
  formatPayrollMonth,
  MONTH_NAMES,
} from '@/lib/staff-payroll';
import { useAuthStore } from '@/stores/auth-store';
import type { StaffPayrollBonusType, StaffPayrollHistory, StaffSettings } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type PayrollForm = {
  year: number;
  month: number;
  monthlySalary: string;
  presentDays: string;
  workingDaysInMonth: string;
  bonusType: StaffPayrollBonusType | '';
  bonusValue: string;
  notes: string;
};

export default function StaffPayrollDetailPage() {
  const params = useParams<{ id: string }>();
  const staffId = params.id;
  const token = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const now = new Date();
  const [message, setMessage] = useState('');

  const [form, setForm] = useState<PayrollForm>({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    monthlySalary: '',
    presentDays: '0',
    workingDaysInMonth: '',
    bonusType: '',
    bonusValue: '',
    notes: '',
  });

  const staffSettings = useQuery({
    queryKey: ['admin', 'settings', 'staff'],
    queryFn: () => apiFetch<StaffSettings>('/api/v1/settings/staff', { token }),
    enabled: !!token,
  });

  const history = useQuery({
    queryKey: ['admin', 'payroll', 'user', staffId],
    queryFn: () =>
      apiFetch<StaffPayrollHistory>(`/api/v1/staff/payroll/user/${staffId}`, { token }),
    enabled: !!token && !!staffId,
  });

  const defaultWorkingDays = staffSettings.data?.workingDaysPerMonth ?? 26;
  const staff = history.data?.staff;
  const records = history.data?.records ?? [];

  const editingRecord = useMemo(
    () => records.find((r) => r.year === form.year && r.month === form.month),
    [records, form.year, form.month],
  );

  useEffect(() => {
    if (!staff) return;
    const workingDays =
      editingRecord?.workingDaysInMonth ??
      (form.workingDaysInMonth.trim() ? Number(form.workingDaysInMonth) : defaultWorkingDays);

    setForm((prev) => ({
      ...prev,
      monthlySalary: editingRecord
        ? String(editingRecord.monthlySalary)
        : staff.monthlySalary != null
          ? String(staff.monthlySalary)
          : prev.monthlySalary,
      presentDays: editingRecord ? String(editingRecord.presentDays) : prev.presentDays,
      workingDaysInMonth: editingRecord
        ? String(editingRecord.workingDaysInMonth)
        : prev.workingDaysInMonth || String(defaultWorkingDays),
      bonusType: editingRecord?.bonusType ?? '',
      bonusValue: editingRecord?.bonusValue != null ? String(editingRecord.bonusValue) : '',
      notes: editingRecord?.notes ?? '',
    }));
  }, [staff, editingRecord, defaultWorkingDays]);

  const upsertPayroll = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch('/api/v1/staff/payroll', {
        method: 'POST',
        token,
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      setMessage('Payroll saved');
      queryClient.invalidateQueries({ queryKey: ['admin', 'payroll', 'user', staffId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'payroll'] });
    },
    onError: (err: Error) => setMessage(err.message),
  });

  const workingDaysInMonth = form.workingDaysInMonth.trim()
    ? Number(form.workingDaysInMonth)
    : defaultWorkingDays;
  const monthlySalary = form.monthlySalary.trim()
    ? Number(form.monthlySalary)
    : (staff?.monthlySalary ?? 0);
  const presentDays = Number(form.presentDays) || 0;
  const bonusValue = form.bonusValue.trim() ? Number(form.bonusValue) : undefined;

  const preview = calcTotalPay(
    monthlySalary,
    presentDays,
    workingDaysInMonth,
    form.bonusType,
    bonusValue,
  );

  const totalEarned = records.reduce(
    (sum, row) => sum + (row.totalPay ?? row.calculatedPay ?? 0),
    0,
  );

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!staffId) return;

    upsertPayroll.mutate({
      userId: staffId,
      year: form.year,
      month: form.month,
      presentDays,
      workingDaysInMonth,
      monthlySalary,
      ...(form.bonusType && bonusValue != null && bonusValue > 0
        ? { bonusType: form.bonusType, bonusValue }
        : {}),
      ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
    });
  }

  if (history.isLoading) {
    return <p className="p-8">Loading…</p>;
  }

  if (!staff) {
    return (
      <div className="space-y-4">
        <p className="text-zinc-500">Staff member not found.</p>
        <Link href="/admin/staff/payroll" className="text-sm underline">
          Back to payroll
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/staff/payroll"
            className="text-sm text-zinc-500 hover:text-zinc-900"
          >
            ← Back to staff list
          </Link>
          <h1 className="mt-2 text-2xl font-bold">{staff.name}</h1>
          <p className="text-sm text-zinc-500">
            {staff.email} · {staff.role}
            {staff.phone ? ` · ${staff.phone}` : ''}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
          <p className="text-zinc-500">Total earned (all months)</p>
          <p className="text-xl font-bold">{formatPrice(totalEarned)}</p>
          <p className="text-xs text-zinc-500">{records.length} month(s) recorded</p>
        </div>
      </div>

      {message ? <p className="text-sm text-zinc-600">{message}</p> : null}

      <form
        onSubmit={handleSave}
        className="space-y-4 rounded-xl border border-zinc-200 p-4"
      >
        <h2 className="font-semibold">Record payroll</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Month</span>
            <select
              value={form.month}
              onChange={(e) => setForm((f) => ({ ...f, month: Number(e.target.value) }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2"
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
              value={form.year}
              onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Monthly salary</span>
            <input
              type="number"
              min={0}
              value={form.monthlySalary}
              onChange={(e) => setForm((f) => ({ ...f, monthlySalary: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Working days (this month)</span>
            <input
              type="number"
              min={1}
              max={31}
              value={form.workingDaysInMonth}
              onChange={(e) =>
                setForm((f) => ({ ...f, workingDaysInMonth: e.target.value }))
              }
              placeholder={String(defaultWorkingDays)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Present days</span>
            <input
              type="number"
              min={0}
              max={workingDaysInMonth}
              value={form.presentDays}
              onChange={(e) => setForm((f) => ({ ...f, presentDays: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Bonus type</span>
            <select
              value={form.bonusType}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  bonusType: e.target.value as StaffPayrollBonusType | '',
                  bonusValue: e.target.value ? f.bonusValue : '',
                }))
              }
              className="w-full rounded-lg border border-zinc-300 px-3 py-2"
            >
              <option value="">No bonus</option>
              <option value="fixed">Fixed amount</option>
              <option value="percent">Percent of base pay</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">
              Bonus value {form.bonusType === 'percent' ? '(%)' : '(amount)'}
            </span>
            <input
              type="number"
              min={0}
              max={form.bonusType === 'percent' ? 100 : undefined}
              disabled={!form.bonusType}
              value={form.bonusValue}
              onChange={(e) => setForm((f) => ({ ...f, bonusValue: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 disabled:bg-zinc-100"
            />
          </label>
          <label className="space-y-1 text-sm sm:col-span-2 lg:col-span-4">
            <span className="font-medium">Notes</span>
            <input
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-zinc-50 px-4 py-3 text-sm">
          <div className="flex flex-wrap gap-4">
            <span>
              Base pay: <strong>{formatPrice(preview.basePay)}</strong>
            </span>
            <span>
              Bonus: <strong>{formatPrice(preview.bonusAmount)}</strong>
            </span>
            <span>
              Total: <strong>{formatPrice(preview.totalPay)}</strong>
            </span>
          </div>
          <Button type="submit" disabled={upsertPayroll.isPending}>
            {upsertPayroll.isPending ? 'Saving…' : editingRecord ? 'Update record' : 'Save record'}
          </Button>
        </div>
      </form>

      <div className="space-y-3">
        <h2 className="font-semibold">Salary history</h2>
        {records.length === 0 ? (
          <p className="text-zinc-500">No payroll records yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50">
                <tr>
                  <th className="p-3">Month</th>
                  <th className="p-3">Present</th>
                  <th className="p-3">Base salary</th>
                  <th className="p-3">Base pay</th>
                  <th className="p-3">Bonus</th>
                  <th className="p-3">Total paid</th>
                  <th className="p-3">Notes</th>
                </tr>
              </thead>
              <tbody>
                {records.map((row) => (
                  <tr
                    key={row._id}
                    className="cursor-pointer border-b border-zinc-100 hover:bg-zinc-50"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        year: row.year,
                        month: row.month,
                      }))
                    }
                  >
                    <td className="p-3 font-medium">{formatPayrollMonth(row.year, row.month)}</td>
                    <td className="p-3">
                      {row.presentDays}/{row.workingDaysInMonth}
                    </td>
                    <td className="p-3">{formatPrice(row.monthlySalary)}</td>
                    <td className="p-3">{formatPrice(row.calculatedPay)}</td>
                    <td className="p-3">
                      {row.bonusAmount > 0 ? (
                        <span>
                          {formatPrice(row.bonusAmount)}
                          {row.bonusType === 'percent' && row.bonusValue != null
                            ? ` (${row.bonusValue}%)`
                            : row.bonusType === 'fixed'
                              ? ' (fixed)'
                              : ''}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-3 font-semibold">
                      {formatPrice(row.totalPay ?? row.calculatedPay)}
                    </td>
                    <td className="p-3 text-zinc-500">{row.notes ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-zinc-500">Click a row to edit that month.</p>
      </div>
    </div>
  );
}
