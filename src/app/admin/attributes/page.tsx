'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import type { Attribute } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export default function AdminAttributesPage() {
  const token = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [valuesText, setValuesText] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  const attributes = useQuery({
    queryKey: ['admin', 'attributes'],
    queryFn: () => apiFetch<Attribute[]>('/api/v1/attribute', { token }),
    enabled: !!token,
  });

  function resetForm() {
    setName('');
    setValuesText('');
    setStatus('active');
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(attr: Attribute) {
    setEditingId(attr._id);
    setName(attr.name);
    setValuesText(attr.values.join(', '));
    setStatus(attr.status);
    setShowForm(true);
  }

  const saveAttribute = useMutation({
    mutationFn: () => {
      const values = valuesText
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
      const body = { name, values, status };

      if (editingId) {
        return apiFetch(`/api/v1/attribute/${editingId}`, {
          method: 'PATCH',
          token,
          body: JSON.stringify(body),
        });
      }
      return apiFetch('/api/v1/attribute', {
        method: 'POST',
        token,
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'attributes'] });
      resetForm();
    },
  });

  const deleteAttribute = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/v1/attribute/${id}`, { method: 'DELETE', token }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'attributes'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Attributes</h1>
          <p className="text-sm text-zinc-500">
            Define catalog attributes like Size (S, M, L) or Color (Red, Blue). Assign them to products, then create variants.
          </p>
        </div>
        <Button onClick={() => (showForm ? resetForm() : setShowForm(true))}>
          {showForm ? 'Cancel' : 'New attribute'}
        </Button>
      </div>

      {showForm ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveAttribute.mutate();
          }}
          className="grid gap-4 rounded-xl border border-zinc-200 p-4 sm:grid-cols-2"
        >
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Size" required />
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <Input
            label="Values (comma separated)"
            value={valuesText}
            onChange={(e) => setValuesText(e.target.value)}
            placeholder="S, M, L, XL"
            required
            className="sm:col-span-2"
          />
          <Button type="submit" disabled={saveAttribute.isPending} className="sm:col-span-2">
            {editingId ? 'Update attribute' : 'Create attribute'}
          </Button>
        </form>
      ) : null}

      {attributes.isLoading ? (
        <p>Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Values</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(attributes.data ?? []).map((attr) => (
                <tr key={attr._id} className="border-b border-zinc-100">
                  <td className="p-3 font-medium">{attr.name}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {attr.values.map((v) => (
                        <span key={v} className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs">
                          {v}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3">{attr.status}</td>
                  <td className="p-3 space-x-2">
                    <Button variant="secondary" onClick={() => startEdit(attr)}>
                      Edit
                    </Button>
                    <Button variant="danger" onClick={() => deleteAttribute.mutate(attr._id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
