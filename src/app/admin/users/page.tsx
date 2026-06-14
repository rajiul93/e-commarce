'use client';

import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { canCreateStaff, isAdminOrManager } from '@/lib/admin-access';
import { useAuthStore } from '@/stores/auth-store';
import type { UserProfile } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type CreateStaffForm = {
  name: string;
  email: string;
  password: string;
  role: 'MANAGER' | 'SELLER';
  phone: string;
  monthlySalary: string;
};

const emptyForm: CreateStaffForm = {
  name: '',
  email: '',
  password: '',
  role: 'SELLER',
  phone: '',
  monthlySalary: '',
};

export default function AdminUsersPage() {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER';
  const canManageStaff = canCreateStaff(user?.role);
  const canViewUsers = isAdminOrManager(user?.role);
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateStaffForm>(emptyForm);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user && !isAdmin && !isManager) {
      router.replace('/admin/pos');
    }
  }, [user, isAdmin, isManager, router]);

  const allUsers = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => apiFetch<UserProfile[]>('/api/v1/user', { token }),
    enabled: !!token && canViewUsers,
  });

  const staff = useQuery({
    queryKey: ['admin', 'staff'],
    queryFn: () => apiFetch<UserProfile[]>('/api/v1/user/staff', { token }),
    enabled: !!token && (isAdmin || user?.role === 'MANAGER'),
  });

  const createStaff = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<UserProfile>('/api/v1/user/staff', {
        method: 'POST',
        token,
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      setForm(emptyForm);
      setMessage('Staff member created');
      queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (err: Error) => setMessage(err.message),
  });

  function handleCreateStaff(e: React.FormEvent) {
    e.preventDefault();
    const salary = form.monthlySalary.trim() ? Number(form.monthlySalary) : undefined;
    createStaff.mutate({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      role: isAdmin ? form.role : 'SELLER',
      ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      ...(salary !== undefined && !Number.isNaN(salary) ? { monthlySalary: salary } : {}),
    });
  }

  const staffRows = staff.data ?? [];
  const customerRows = canViewUsers
    ? (allUsers.data ?? []).filter((u) => u.role === 'USER')
    : [];

  if (user && !isAdmin && !isManager) {
    return <p className="text-sm text-zinc-500">Redirecting…</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{isAdmin ? 'Users & staff' : 'Staff'}</h1>
        <p className="text-sm text-zinc-500">
          {isAdmin
            ? 'Manage customers and staff — password, NID, profile image (admin only)'
            : 'View staff and create seller accounts'}
        </p>
      </div>

      {message ? <p className="text-sm text-zinc-600">{message}</p> : null}

      {canManageStaff ? (
        <form
          onSubmit={handleCreateStaff}
          className="grid max-w-xl gap-4 rounded-xl border border-zinc-200 p-4"
        >
          <h2 className="font-semibold">Create staff</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Name</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Email</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Password</span>
            <input
              required
              type="password"
              minLength={6}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>
          {isAdmin ? (
            <label className="space-y-1 text-sm">
              <span className="font-medium">Role</span>
              <select
                value={form.role}
                onChange={(e) =>
                  setForm((f) => ({ ...f, role: e.target.value as 'MANAGER' | 'SELLER' }))
                }
                className="w-full rounded-lg border border-zinc-300 px-3 py-2"
              >
                <option value="MANAGER">Manager</option>
                <option value="SELLER">Seller</option>
              </select>
            </label>
          ) : null}
          <label className="space-y-1 text-sm">
            <span className="font-medium">Phone (optional)</span>
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>
          {isAdmin ? (
            <label className="space-y-1 text-sm">
              <span className="font-medium">Monthly salary (optional)</span>
              <input
                type="number"
                min={0}
                value={form.monthlySalary}
                onChange={(e) => setForm((f) => ({ ...f, monthlySalary: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2"
              />
            </label>
          ) : null}
        </div>
        <Button type="submit" disabled={createStaff.isPending}>
          {createStaff.isPending ? 'Creating…' : 'Create staff'}
        </Button>
      </form>
      ) : null}

      <div className="space-y-3">
        <h2 className="font-semibold">Staff members</h2>
        {staff.isLoading ? (
          <p>Loading…</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  {isAdmin ? <th className="p-3">Salary</th> : null}
                  {isAdmin ? <th className="p-3">Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {staffRows.map((row) => (
                  <tr key={row._id} className="border-b border-zinc-100">
                    <td className="p-3">{row.name}</td>
                    <td className="p-3">{row.email}</td>
                    <td className="p-3">{row.role}</td>
                    {isAdmin ? (
                      <td className="p-3">
                        {row.monthlySalary != null ? row.monthlySalary.toLocaleString() : '—'}
                      </td>
                    ) : null}
                    {isAdmin ? (
                      <td className="p-3">
                        <Link
                          href={`/admin/users/${row._id}`}
                          className="text-blue-600 hover:underline"
                        >
                          Manage
                        </Link>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {canViewUsers ? (
        <div className="space-y-3">
          <h2 className="font-semibold">Customers</h2>
          {allUsers.isLoading ? (
            <p>Loading…</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-zinc-200">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50">
                  <tr>
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    {isAdmin ? <th className="p-3">Actions</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {customerRows.map((row) => (
                    <tr key={row._id} className="border-b border-zinc-100">
                      <td className="p-3">{row.name}</td>
                      <td className="p-3">{row.email}</td>
                      {isAdmin ? (
                        <td className="p-3">
                          <Link
                            href={`/admin/users/${row._id}`}
                            className="text-blue-600 hover:underline"
                          >
                            Manage
                          </Link>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
