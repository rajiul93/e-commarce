'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProductThumbnail } from '@/hooks/use-product-thumbnail';
import { apiFetch } from '@/lib/api';
import { uploadMedia, updateMedia, rollbackUploadedMedia } from '@/lib/media-api';
import { useAuthStore } from '@/stores/auth-store';
import type { Collection, Product } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';

type FormState = {
  name: string;
  productIds: string[];
  showBannerOnHome: boolean;
  isActive: boolean;
  sortOrder: number;
};

const emptyForm = (): FormState => ({
  name: '',
  productIds: [],
  showBannerOnHome: true,
  isActive: true,
  sortOrder: 0,
});

export default function AdminCollectionsPage() {
  const token = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const banner = useProductThumbnail();
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [productSearch, setProductSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const collections = useQuery({
    queryKey: ['admin', 'collections'],
    queryFn: () => apiFetch<Collection[]>('/api/v1/collection/admin/all', { token }),
    enabled: !!token,
  });

  const products = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: () => apiFetch<Product[]>('/api/v1/product/admin/all', { token }),
    enabled: !!token,
  });

  const filteredProducts = (products.data ?? []).filter((p) =>
    p.title.toLowerCase().includes(productSearch.toLowerCase()),
  );

  function closeForm() {
    setMode('list');
    setEditingId(null);
    setForm(emptyForm());
    setProductSearch('');
    setError('');
    banner.reset();
  }

  function startCreate() {
    banner.reset();
    setForm(emptyForm());
    setEditingId(null);
    setMode('create');
    setError('');
  }

  function startEdit(collection: Collection) {
    banner.reset();
    banner.setExisting(collection.banner ?? null);
    setForm({
      name: collection.name,
      productIds: (collection.products ?? []).map((p) => p._id),
      showBannerOnHome: collection.showBannerOnHome,
      isActive: collection.isActive ?? true,
      sortOrder: collection.sortOrder ?? 0,
    });
    setEditingId(collection._id);
    setMode('edit');
    setError('');
  }

  function toggleProduct(id: string) {
    setForm((prev) => ({
      ...prev,
      productIds: prev.productIds.includes(id)
        ? prev.productIds.filter((x) => x !== id)
        : [...prev.productIds, id],
    }));
  }

  async function resolveBannerId(): Promise<string | null | undefined> {
    if (!token) return undefined;
    if (banner.removed) return null;
    if (banner.selectedFile) {
      if (banner.existingImageId) {
        const updated = await updateMedia(banner.existingImageId, banner.selectedFile, token, {
          alt: form.name.trim() || 'Collection banner',
          useCase: 'BANNER',
        });
        return updated._id;
      }
      const uploaded = await uploadMedia(banner.selectedFile, token, {
        alt: form.name.trim() || 'Collection banner',
        useCase: 'BANNER',
      });
      return uploaded._id;
    }
    return banner.existingImageId ?? undefined;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    setSubmitting(true);
    setError('');
    let uploadedId: string | null = null;

    try {
      const bannerId = await resolveBannerId();
      if (banner.selectedFile && !banner.existingImageId && bannerId) {
        uploadedId = bannerId;
      }

      const body = {
        name: form.name.trim(),
        products: form.productIds,
        showBannerOnHome: form.showBannerOnHome,
        isActive: form.isActive,
        sortOrder: form.sortOrder,
        ...(bannerId !== undefined ? { banner: bannerId } : {}),
      };

      if (mode === 'create') {
        await apiFetch('/api/v1/collection/create', {
          method: 'POST',
          token,
          body: JSON.stringify(body),
        });
      } else if (mode === 'edit' && editingId) {
        await apiFetch(`/api/v1/collection/${editingId}`, {
          method: 'PATCH',
          token,
          body: JSON.stringify(body),
        });
      }

      queryClient.invalidateQueries({ queryKey: ['admin', 'collections'] });
      closeForm();
    } catch (err) {
      if (uploadedId) {
        await rollbackUploadedMedia([uploadedId], token);
      }
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSubmitting(false);
    }
  }

  const deleteCollection = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/v1/collection/${id}`, { method: 'DELETE', token }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'collections'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Collections</h1>
          <p className="text-sm text-zinc-500">
            Group products into collections with optional banners for the home page.
          </p>
        </div>
        {mode === 'list' ? (
          <Button onClick={startCreate}>New collection</Button>
        ) : (
          <Button variant="secondary" onClick={closeForm}>
            Cancel
          </Button>
        )}
      </div>

      {mode !== 'list' ? (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-zinc-200 p-4">
          <h2 className="font-medium">{mode === 'create' ? 'Create collection' : 'Edit collection'}</h2>

          <Input
            label="Collection name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">Banner</span>
                <p className="text-xs text-zinc-500">Uploads when you save. Optional.</p>
              </div>
              <Button type="button" variant="secondary" onClick={() => bannerInputRef.current?.click()}>
                {banner.displayUrl ? 'Change banner' : 'Add banner'}
              </Button>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  banner.handleFileSelect(e.target.files?.[0] ?? null);
                  e.target.value = '';
                }}
              />
            </div>
            {banner.displayUrl ? (
              <div className="relative h-40 w-full max-w-xl overflow-hidden rounded-lg border border-zinc-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={banner.displayUrl} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  className="absolute right-2 top-2 rounded bg-white/90 px-2 py-1 text-xs shadow"
                  onClick={() => banner.removeThumbnail()}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex h-32 max-w-xl items-center justify-center rounded-lg border border-dashed border-zinc-300 text-xs text-zinc-400">
                No banner selected
              </div>
            )}
          </div>

          <label className="flex items-start gap-3 rounded-lg border border-zinc-200 p-3">
            <input
              type="checkbox"
              checked={form.showBannerOnHome}
              onChange={(e) => setForm({ ...form, showBannerOnHome: e.target.checked })}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium">Show banner on home page</span>
              <span className="block text-xs text-zinc-500">
                Collection products still appear on home when active; this controls the banner image
                only.
              </span>
            </span>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Active on home page
          </label>

          <Input
            label="Sort order"
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) || 0 })}
          />

          <div className="space-y-2">
            <span className="text-sm font-medium">Products</span>
            <Input
              label="Search products"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
            <div className="max-h-64 overflow-y-auto rounded-lg border border-zinc-200">
              {filteredProducts.length === 0 ? (
                <p className="p-4 text-sm text-zinc-500">No products found.</p>
              ) : (
                <ul className="divide-y divide-zinc-100">
                  {filteredProducts.map((product) => (
                    <li key={product._id}>
                      <label className="flex cursor-pointer items-center gap-3 p-3 hover:bg-zinc-50">
                        <input
                          type="checkbox"
                          checked={form.productIds.includes(product._id)}
                          onChange={() => toggleProduct(product._id)}
                        />
                        <span className="text-sm">
                          {product.title}{' '}
                          <span className="text-zinc-400">({product.status})</span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="text-xs text-zinc-500">{form.productIds.length} product(s) selected</p>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : mode === 'create' ? 'Create collection' : 'Update collection'}
          </Button>
        </form>
      ) : null}

      {collections.isLoading ? (
        <p>Loading…</p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200">
          {(collections.data ?? []).map((collection) => (
            <li key={collection._id} className="flex flex-wrap items-start justify-between gap-4 p-4">
              <div className="flex gap-4">
                {collection.banner?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={collection.banner.url}
                    alt=""
                    className="h-16 w-28 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-28 items-center justify-center rounded-lg bg-zinc-100 text-xs text-zinc-400">
                    No banner
                  </div>
                )}
                <div>
                  <p className="font-medium">{collection.name}</p>
                  <p className="text-xs text-zinc-500">
                    {(collection.products ?? []).length} products ·{' '}
                    {collection.isActive ? 'Active' : 'Inactive'} · Banner on home:{' '}
                    {collection.showBannerOnHome ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => startEdit(collection)}>
                  Edit
                </Button>
                <Button variant="danger" onClick={() => deleteCollection.mutate(collection._id)}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
