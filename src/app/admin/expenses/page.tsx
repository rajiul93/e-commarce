'use client';

import { formatPrice } from '@/components/shop/product-card';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { isAdminOrManager } from '@/lib/admin-access';
import { uploadMedia } from '@/lib/media-api';
import { useAuthStore } from '@/stores/auth-store';
import type { ExpenseRecord, ExpenseTypeRecord } from '@/types';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

type Period = 'week' | 'month' | 'year';

const PERIOD_LABELS: Record<Period, string> = {
  week: 'Weekly',
  month: 'Monthly',
  year: 'Yearly',
};

export default function AdminExpensesPage() {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';
  const managerOrAdmin = isAdminOrManager(user?.role);
  const searchParams = useSearchParams();
  const period = (searchParams.get('period') as Period) || 'month';
  const queryClient = useQueryClient();

  const [typeId, setTypeId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [newTypeName, setNewTypeName] = useState('');
  const [message, setMessage] = useState('');

  const types = useQuery({
    queryKey: ['admin', 'expense-types'],
    queryFn: () => apiFetch<ExpenseTypeRecord[]>('/api/v1/expense/types', { token }),
    enabled: !!token && managerOrAdmin,
  });

  const expenses = useQuery({
    queryKey: ['admin', 'expenses', period],
    queryFn: () =>
      apiFetch<ExpenseRecord[]>('/api/v1/expense', { token, params: { period } }),
    enabled: !!token && managerOrAdmin,
  });

  const createType = useMutation({
    mutationFn: (name: string) =>
      apiFetch<ExpenseTypeRecord>('/api/v1/expense/types', {
        method: 'POST',
        token,
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => {
      setNewTypeName('');
      setMessage('Expense type created');
      queryClient.invalidateQueries({ queryKey: ['admin', 'expense-types'] });
    },
    onError: (err: Error) => setMessage(err.message),
  });

  const createExpense = useMutation({
    mutationFn: async () => {
      let imageId: string | undefined;
      if (imageFile && token) {
        const uploaded = await uploadMedia(imageFile, token, { useCase: 'EXPENSE' });
        imageId = uploaded._id;
      }
      return apiFetch<ExpenseRecord>('/api/v1/expense', {
        method: 'POST',
        token,
        body: JSON.stringify({
          typeId,
          description: description.trim(),
          amount: Number(amount),
          ...(imageId ? { imageId } : {}),
          ...(expenseDate ? { expenseDate: new Date(expenseDate).toISOString() } : {}),
        }),
      });
    },
    onSuccess: () => {
      setDescription('');
      setAmount('');
      setImageFile(null);
      setMessage('Expense recorded');
      queryClient.invalidateQueries({ queryKey: ['admin', 'expenses'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'analytics'] });
    },
    onError: (err: Error) => setMessage(err.message),
  });

  const deleteExpense = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/v1/expense/${id}`, { method: 'DELETE', token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'expenses'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'analytics'] });
    },
  });

  const deleteType = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/v1/expense/types/${id}`, { method: 'DELETE', token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'expense-types'] });
    },
    onError: (err: Error) => setMessage(err.message),
  });

  const total = (expenses.data ?? []).reduce((sum, row) => sum + row.amount, 0);
  const activeTypes = (types.data ?? []).filter((t) => t.isActive);

  if (!managerOrAdmin) {
    return <p className="text-sm text-zinc-500">Access denied.</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-900">
            ← Dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-bold">Expenses</h1>
          <p className="text-sm text-zinc-500">Record and track business expenses</p>
        </div>
        <div className="flex gap-2">
          {(['week', 'month', 'year'] as Period[]).map((p) => (
            <Link key={p} href={`/admin/expenses?period=${p}`}>
              <Button variant={period === p ? 'primary' : 'secondary'}>{PERIOD_LABELS[p]}</Button>
            </Link>
          ))}
        </div>
      </div>

      {message ? <p className="text-sm text-zinc-600">{message}</p> : null}

      {isAdmin ? (
        <div className="rounded-xl border border-zinc-200 p-4">
          <h2 className="font-semibold">Expense types (admin)</h2>
          <p className="mb-3 text-sm text-zinc-500">Create categories for expenses</p>
          <div className="flex flex-wrap gap-2">
            {(types.data ?? []).map((t) => (
              <span
                key={t._id}
                className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-sm"
              >
                {t.name}
                {!t.isActive ? <span className="text-xs text-zinc-400">(inactive)</span> : null}
                <button
                  type="button"
                  className="text-xs text-red-600"
                  onClick={() => deleteType.mutate(t._id)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <form
            className="mt-3 flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!newTypeName.trim()) return;
              createType.mutate(newTypeName.trim());
            }}
          >
            <input
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              placeholder="New type e.g. Rent, Utilities"
              className="min-w-[200px] flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
            <Button type="submit" disabled={createType.isPending}>
              Add type
            </Button>
          </form>
        </div>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!typeId || !description.trim() || !amount) return;
          createExpense.mutate();
        }}
        className="grid gap-4 rounded-xl border border-zinc-200 p-4 md:grid-cols-2"
      >
        <h2 className="font-semibold md:col-span-2">Record expense</h2>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Type</span>
          <select
            required
            value={typeId}
            onChange={(e) => setTypeId(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2"
          >
            <option value="">Select type</option>
            {activeTypes.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Amount</span>
          <input
            type="number"
            min={0}
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2"
          />
        </label>
        <label className="space-y-1 text-sm md:col-span-2">
          <span className="font-medium">Description</span>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2"
            placeholder="What was this expense for?"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Date</span>
          <input
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Receipt image (optional)</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm"
          />
        </label>
        <div className="md:col-span-2">
          <Button type="submit" disabled={createExpense.isPending || activeTypes.length === 0}>
            {createExpense.isPending ? 'Saving…' : 'Save expense'}
          </Button>
        </div>
      </form>

      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
        <p className="text-sm text-red-800">Manual expenses ({PERIOD_LABELS[period]})</p>
        <p className="text-2xl font-bold text-red-900">{formatPrice(total)}</p>
      </div>

      {expenses.isLoading ? (
        <p>Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Type</th>
                <th className="p-3">Description</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Receipt</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {(expenses.data ?? []).map((row) => {
                const typeName =
                  typeof row.typeId === 'object' ? row.typeId.name : String(row.typeId);
                const image =
                  row.imageId && typeof row.imageId === 'object' ? row.imageId : null;
                return (
                  <tr key={row._id} className="border-b border-zinc-100">
                    <td className="p-3">
                      {row.expenseDate
                        ? new Date(row.expenseDate).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="p-3">{typeName}</td>
                    <td className="p-3 max-w-xs truncate">{row.description}</td>
                    <td className="p-3 font-semibold">{formatPrice(row.amount)}</td>
                    <td className="p-3">
                      {image?.url ? (
                        <a href={image.url} target="_blank" rel="noreferrer" className="underline">
                          View
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-3">
                      <Button
                        variant="danger"
                        className="text-xs"
                        onClick={() => deleteExpense.mutate(row._id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {(expenses.data ?? []).length === 0 ? (
            <p className="p-6 text-center text-zinc-500">No expenses in this period.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
