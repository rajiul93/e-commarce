'use client';

import { formatPrice } from '@/components/shop/product-card';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { apiFetch } from '@/lib/api';
import { calcTotalPay, formatPayrollMonth } from '@/lib/staff-payroll';
import { useAuthStore } from '@/stores/auth-store';
import type { StaffPayroll, StaffPayrollBonusType, UserProfile } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  staff: UserProfile;
  year: number;
  month: number;
  defaultWorkingDays: number;
  existing?: StaffPayroll;
  onSaved?: () => void;
};

type FormState = {
  monthlySalary: string;
  presentDays: string;
  workingDaysInMonth: string;
  bonusType: StaffPayrollBonusType | '';
  bonusValue: string;
  workRating: string;
  notes: string;
};

export function StaffPayrollDialog({
  open,
  onClose,
  staff,
  year,
  month,
  defaultWorkingDays,
  existing,
  onSaved,
}: Props) {
  const token = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const [form, setForm] = useState<FormState>({
    monthlySalary: '',
    presentDays: '0',
    workingDaysInMonth: String(defaultWorkingDays),
    bonusType: '',
    bonusValue: '',
    workRating: '',
    notes: '',
  });

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm({
      monthlySalary: existing
        ? String(existing.monthlySalary)
        : staff.monthlySalary != null
          ? String(staff.monthlySalary)
          : '',
      presentDays: existing ? String(existing.presentDays) : '0',
      workingDaysInMonth: existing
        ? String(existing.workingDaysInMonth)
        : String(defaultWorkingDays),
      bonusType: existing?.bonusType ?? '',
      bonusValue: existing?.bonusValue != null ? String(existing.bonusValue) : '',
      workRating: existing?.workRating != null ? String(existing.workRating) : '',
      notes: existing?.notes ?? '',
    });
  }, [open, existing, staff, defaultWorkingDays]);

  const upsertPayroll = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch('/api/v1/staff/payroll', {
        method: 'POST',
        token,
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payroll'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'payroll', 'user', staff._id] });
      onSaved?.();
      onClose();
    },
    onError: (err: Error) => setError(err.message),
  });

  const workingDaysInMonth = form.workingDaysInMonth.trim()
    ? Number(form.workingDaysInMonth)
    : defaultWorkingDays;
  const monthlySalary = form.monthlySalary.trim()
    ? Number(form.monthlySalary)
    : (staff.monthlySalary ?? 0);
  const presentDays = Number(form.presentDays) || 0;
  const bonusValue = form.bonusValue.trim() ? Number(form.bonusValue) : undefined;

  const preview = calcTotalPay(
    monthlySalary,
    presentDays,
    workingDaysInMonth,
    form.bonusType,
    bonusValue,
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    upsertPayroll.mutate({
      userId: staff._id,
      year,
      month,
      presentDays,
      workingDaysInMonth,
      monthlySalary,
      ...(form.bonusType && bonusValue != null && bonusValue > 0
        ? { bonusType: form.bonusType, bonusValue }
        : {}),
      ...(form.workRating.trim() ? { workRating: Number(form.workRating) } : {}),
      ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
    });
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={existing ? 'Update salary' : 'Create salary'}
      description={`${staff.name} · ${formatPayrollMonth(year, month)} — one record per month`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Monthly salary</span>
            <input
              type="number"
              min={0}
              required
              value={form.monthlySalary}
              onChange={(e) => setForm((f) => ({ ...f, monthlySalary: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Working days</span>
            <input
              type="number"
              min={1}
              max={31}
              required
              value={form.workingDaysInMonth}
              onChange={(e) => setForm((f) => ({ ...f, workingDaysInMonth: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Present days</span>
            <input
              type="number"
              min={0}
              max={workingDaysInMonth}
              required
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
          <label className="space-y-1 text-sm sm:col-span-2">
            <span className="font-medium">
              Bonus value {form.bonusType === 'percent' ? '(%)' : form.bonusType ? '(amount)' : ''}
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
          <label className="space-y-1 text-sm">
            <span className="font-medium">Work rating (1–5)</span>
            <select
              value={form.workRating}
              onChange={(e) => setForm((f) => ({ ...f, workRating: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2"
            >
              <option value="">Not rated</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} star{n > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm sm:col-span-2">
            <span className="font-medium">Notes (optional)</span>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>
        </div>

        <div className="rounded-lg bg-zinc-50 px-4 py-3 text-sm">
          <div className="flex flex-wrap gap-4">
            <span>
              Base: <strong>{formatPrice(preview.basePay)}</strong>
            </span>
            <span>
              Bonus: <strong>{formatPrice(preview.bonusAmount)}</strong>
            </span>
            <span>
              Total: <strong>{formatPrice(preview.totalPay)}</strong>
            </span>
          </div>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={upsertPayroll.isPending}>
            {upsertPayroll.isPending ? 'Saving…' : existing ? 'Update' : 'Create salary'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
