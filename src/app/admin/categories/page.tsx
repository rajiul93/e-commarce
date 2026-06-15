'use client';

import { ProductThumbnailPicker } from '@/components/admin/product-thumbnail-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProductThumbnail } from '@/hooks/use-product-thumbnail';
import { apiFetch } from '@/lib/api';
import { makeSlug } from '@/lib/slug';
import { uploadMedia, updateMedia, rollbackUploadedMedia } from '@/lib/media-api';
import { useAuthStore } from '@/stores/auth-store';
import type { Category } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

export default function AdminCategoriesPage() {
  const token = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const thumbnail = useProductThumbnail();

  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiFetch<Category[]>('/api/v1/category'),
  });

  function closeForm() {
    setMode('list');
    setEditingId(null);
    setName('');
    setSlug('');
    setSlugTouched(false);
    setDescription('');
    setError('');
    thumbnail.reset();
  }

  function startCreate() {
    thumbnail.reset();
    setName('');
    setSlug('');
    setSlugTouched(false);
    setDescription('');
    setEditingId(null);
    setMode('create');
    setError('');
  }

  function startEdit(cat: Category) {
    thumbnail.reset();
    thumbnail.setExisting(cat.image ?? null);
    setName(cat.categoryName);
    setSlug(cat.slug);
    setSlugTouched(true);
    setDescription(cat.description ?? '');
    setEditingId(cat._id);
    setMode('edit');
    setError('');
  }

  useEffect(() => {
    if (mode !== 'create' || slugTouched) return;
    setSlug(makeSlug(name));
  }, [name, mode, slugTouched]);

  async function resolveImageId(): Promise<string | null | undefined> {
    if (!token) return undefined;
    if (thumbnail.removed) return null;
    if (thumbnail.selectedFile) {
      if (thumbnail.existingImageId) {
        const updated = await updateMedia(thumbnail.existingImageId, thumbnail.selectedFile, token, {
          alt: name.trim() || 'Category image',
          useCase: 'CATEGORY',
        });
        return updated._id;
      }
      const uploaded = await uploadMedia(thumbnail.selectedFile, token, {
        alt: name.trim() || 'Category image',
        useCase: 'CATEGORY',
      });
      return uploaded._id;
    }
    return undefined;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    setSubmitting(true);
    setError('');
    let uploadedId: string | null = null;

    try {
      const imageId = await resolveImageId();
      if (thumbnail.selectedFile && !thumbnail.existingImageId && imageId) {
        uploadedId = imageId;
      }

      const body = {
        categoryName: name.trim(),
        ...(slug.trim() ? { slug: slug.trim() } : {}),
        description: description.trim() || undefined,
        ...(imageId !== undefined ? { image: imageId } : {}),
      };

      if (mode === 'create') {
        await apiFetch('/api/v1/category/create', {
          method: 'POST',
          token,
          body: JSON.stringify(body),
        });
      } else if (mode === 'edit' && editingId) {
        await apiFetch(`/api/v1/category/${editingId}`, {
          method: 'PATCH',
          token,
          body: JSON.stringify(body),
        });
      }

      queryClient.invalidateQueries({ queryKey: ['categories'] });
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

  const deleteCategory = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/v1/category/${id}`, { method: 'DELETE', token }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        {mode === 'list' ? (
          <Button onClick={startCreate}>New category</Button>
        ) : (
          <Button variant="secondary" onClick={closeForm}>
            Cancel
          </Button>
        )}
      </div>

      {mode !== 'list' ? (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-zinc-200 p-4">
          <h2 className="font-medium">{mode === 'create' ? 'Create category' : 'Edit category'}</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input
              label="Slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              placeholder="category-url-slug"
              required
            />
            <Input
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <ProductThumbnailPicker thumbnail={thumbnail} />

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : mode === 'create' ? 'Create category' : 'Update category'}
          </Button>
        </form>
      ) : null}

      <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200">
        {(categories.data ?? []).map((cat) => (
          <li key={cat._id} className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-4">
              {cat.image?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cat.image.url}
                  alt=""
                  className="h-14 w-14 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-zinc-100 text-xs text-zinc-400">
                  No image
                </div>
              )}
              <div>
                <p className="font-medium">{cat.categoryName}</p>
                <p className="text-xs text-zinc-500">{cat.slug}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => startEdit(cat)}>
                Edit
              </Button>
              <Button variant="danger" onClick={() => deleteCategory.mutate(cat._id)}>
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
