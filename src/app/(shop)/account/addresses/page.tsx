'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import type { Address } from '@/types';
import { useEffect, useState } from 'react';

const emptyForm = {
  name: '',
  phone: '',
  country: 'Bangladesh',
  state: '',
  city: '',
  thana: '',
  localLocation: '',
  isDefault: false,
};

export default function AddressesPage() {
  const token = useAuthStore((s) => s.accessToken);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  function load() {
    if (!token) return;
    apiFetch<Address[]>('/api/v1/address', { token }).then(setAddresses).catch(() => setAddresses([]));
  }

  useEffect(() => {
    if (!token) return;
    load();
  }, [token]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    try {
      await apiFetch('/api/v1/address', { method: 'POST', token, body: JSON.stringify(form) });
      setForm(emptyForm);
      setShowForm(false);
      load();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!token) return;
    await apiFetch(`/api/v1/address/${id}`, { method: 'DELETE', token });
    load();
  }

  if (!token) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Addresses</h1>
        <Button variant="secondary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add address'}
        </Button>
      </div>

      {showForm ? (
        <form onSubmit={handleCreate} className="grid gap-4 rounded-xl border border-zinc-200 p-4 sm:grid-cols-2">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <Input label="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} required />
          <Input label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required />
          <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
          <Input label="Thana" value={form.thana} onChange={(e) => setForm({ ...form, thana: e.target.value })} required />
          <Input label="Local location" value={form.localLocation} onChange={(e) => setForm({ ...form, localLocation: e.target.value })} required className="sm:col-span-2" />
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
            Set as default
          </label>
          <Button type="submit" disabled={loading} className="sm:col-span-2">
            Save address
          </Button>
        </form>
      ) : null}

      <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200">
        {addresses.map((a) => (
          <li key={a._id} className="flex items-start justify-between gap-4 p-4">
            <div>
              <p className="font-medium">
                {a.name} {a.isDefault ? <span className="text-xs text-zinc-500">(default)</span> : null}
              </p>
              <p className="text-sm text-zinc-500">
                {a.localLocation}, {a.thana}, {a.city}, {a.state}, {a.country}
              </p>
              <p className="text-sm text-zinc-500">{a.phone}</p>
            </div>
            <Button variant="ghost" onClick={() => handleDelete(a._id)}>
              Delete
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
