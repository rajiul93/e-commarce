'use client';

import { ProductThumbnailPicker } from '@/components/admin/product-thumbnail-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProductThumbnail } from '@/hooks/use-product-thumbnail';
import { apiFetch } from '@/lib/api';
import { uploadMedia, rollbackUploadedMedia } from '@/lib/media-api';
import { useAuthStore } from '@/stores/auth-store';
import type { Brand } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export default function AdminBrandsPage() {
  const token = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const thumbnail = useProductThumbnail();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const brands = useQuery({
    queryKey: ['admin', 'brands'],
    queryFn: () => apiFetch<Brand[]>('/api/v1/brand', { token }),
    enabled: !!token,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !thumbnail.selectedFile) {
      setError('Brand name and image are required');
      return;
    }

    setSubmitting(true);
    setError('');
    let uploadedId: string | null = null;

    try {
      const uploaded = await uploadMedia(thumbnail.selectedFile, token, {
        alt: name.trim() || 'Brand logo',
        useCase: 'LOGO',
      });
      uploadedId = uploaded._id;

      await apiFetch('/api/v1/brand', {
        method: 'POST',
        token,
        body: JSON.stringify({ brandName: name.trim(), image: uploaded._id }),
      });

      queryClient.invalidateQueries({ queryKey: ['admin', 'brands'] });
      setName('');
      thumbnail.reset();
    } catch (err) {
      if (uploadedId) await rollbackUploadedMedia([uploadedId], token);
      setError(err instanceof Error ? err.message : 'Failed to create brand');
    } finally {
      setSubmitting(false);
    }
  }

  const deleteBrand = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/v1/brand/${id}`, { method: 'DELETE', token }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'brands'] }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Brands</h1>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-zinc-200 p-4">
        <Input label="Brand name" value={name} onChange={(e) => setName(e.target.value)} required />
        <ProductThumbnailPicker thumbnail={thumbnail} />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Adding…' : 'Add brand'}
        </Button>
      </form>

      <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200">
        {(brands.data ?? []).map((brand) => (
          <li key={brand._id} className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-4">
              {brand.image?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brand.image.url} alt="" className="h-12 w-12 rounded-lg object-cover" />
              ) : null}
              <p className="font-medium">{brand.brandName}</p>
            </div>
            <Button variant="danger" onClick={() => deleteBrand.mutate(brand._id)}>
              Delete
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
