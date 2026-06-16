'use client';

import { ProductVariantSetup } from '@/components/admin/product-variant-setup';
import { RichTextEditor } from '@/components/admin/rich-text-editor';
import { ProductImagePicker } from '@/components/admin/product-image-picker';
import { ProductThumbnailPicker } from '@/components/admin/product-thumbnail-picker';
import { formatPrice } from '@/components/shop/product-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProductGallery } from '@/hooks/use-product-gallery';
import { useProductThumbnail } from '@/hooks/use-product-thumbnail';
import { apiFetch } from '@/lib/api';
import { getProductThumbnailUrl } from '@/lib/product-image-utils';
import {
  rebuildRowsForAttributes,
  resolveAssignedAttributes,
  validateUniqueVariantRows,
  variantsToRows,
  type VariantDraftRow,
} from '@/lib/variant-draft';
import { createVariantsForProduct, syncVariantsForProduct } from '@/lib/sync-variants';
import {
  resolveProductImagesForCreate,
  resolveProductImagesForUpdate,
  resolveSingleImageForCreate,
  resolveSingleImageForUpdate,
  rollbackUploadedMedia,
} from '@/lib/product-images';
import { useAuthStore } from '@/stores/auth-store';
import { SITE_NAME } from '@/lib/site-config';
import { makeSlug } from '@/lib/slug';
import type { Attribute, Brand, Category, Product, Variant } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

type ProductForm = {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  category: string;
  brandId: string;
  averageRating: number;
  status: Product['status'];
  attributeIds: string[];
  seoTitle: string;
  seoDescription: string;
  ogTitle: string;
  ogDescription: string;
  isFeatured: boolean;
  isBestSeller: boolean;
  offerType: Product['offerType'];
  offerValue: number;
};

const emptyForm = (): ProductForm => ({
  title: '',
  slug: '',
  shortDescription: '',
  description: '',
  category: '',
  brandId: '',
  averageRating: 0,
  status: 'draft',
  attributeIds: [],
  seoTitle: '',
  seoDescription: '',
  ogTitle: '',
  ogDescription: '',
  isFeatured: false,
  isBestSeller: false,
  offerType: 'none',
  offerValue: 0,
});

export default function AdminProductsPage() {
  const token = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const gallery = useProductGallery();
  const thumbnail = useProductThumbnail();
  const ogImage = useProductThumbnail();

  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingAttributesId, setEditingAttributesId] = useState<string | null>(null);
  const [selectedAttributeIds, setSelectedAttributeIds] = useState<string[]>([]);
  const [variantRows, setVariantRows] = useState<VariantDraftRow[]>([]);
  const [loadedVariants, setLoadedVariants] = useState<Variant[]>([]);
  const [existingVariantIds, setExistingVariantIds] = useState<string[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm());
  const [slugTouched, setSlugTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const products = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: () => apiFetch<Product[]>('/api/v1/product/admin/all', { token }),
    enabled: !!token,
  });

  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiFetch<Category[]>('/api/v1/category'),
  });

  const brands = useQuery({
    queryKey: ['admin', 'brands'],
    queryFn: () => apiFetch<Brand[]>('/api/v1/brand', { token }),
    enabled: !!token,
  });

  const attributes = useQuery({
    queryKey: ['admin', 'attributes'],
    queryFn: () => apiFetch<Attribute[]>('/api/v1/attribute', { token }),
    enabled: !!token,
  });

  const activeAttributes = (attributes.data ?? []).filter((a) => a.status === 'active');

  function toggleAttribute(id: string, list: string[], setter: (ids: string[]) => void) {
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  function closeForm() {
    setMode('list');
    setEditingId(null);
    setForm(emptyForm());
    setSlugTouched(false);
    setError('');
    gallery.reset();
    thumbnail.reset();
    ogImage.reset();
    setVariantRows([]);
    setLoadedVariants([]);
    setExistingVariantIds([]);
  }

  function startCreate() {
    gallery.reset();
    thumbnail.reset();
    ogImage.reset();
    setForm(emptyForm());
    setSlugTouched(false);
    setVariantRows([]);
    setLoadedVariants([]);
    setExistingVariantIds([]);
    setError('');
    setEditingId(null);
    setMode('create');
  }

  async function startEdit(product: Product) {
    if (!token) return;

    const variants = await apiFetch<Variant[]>('/api/v1/variant', {
      token,
      params: { productId: product._id },
    });
    const assigned = resolveAssignedAttributes(
      product.attributes ?? [],
      activeAttributes,
      (product.attributes ?? []).map((a) => a._id),
    );

    setEditingId(product._id);
    setForm({
      title: product.title,
      slug: product.slug,
      shortDescription: product.shortDescription ?? '',
      description: product.description ?? '',
      category: product.category?._id ?? '',
      brandId: product.brand?._id ?? '',
      averageRating: product.averageRating ?? 0,
      status: product.status,
      attributeIds: (product.attributes ?? []).map((a) => a._id),
      seoTitle: product.seoTitle ?? '',
      seoDescription: product.seoDescription ?? '',
      ogTitle: product.ogTitle ?? '',
      ogDescription: product.ogDescription ?? '',
      isFeatured: product.isFeatured ?? false,
      isBestSeller: product.isBestSeller ?? false,
      offerType: product.offerType ?? 'none',
      offerValue: product.offerValue ?? 0,
    });
    gallery.setFromServer(product.gallery ?? []);
    thumbnail.setExisting(product.thumbnail ?? null);
    ogImage.setExisting(product.ogImage ?? null);
    setLoadedVariants(variants);
    setVariantRows(variantsToRows(assigned, variants, product.title));
    setExistingVariantIds(variants.map((v) => v._id));
    setSlugTouched(true);
    setError('');
    setMode('edit');
  }

  const editingProduct =
    mode === 'edit' && editingId
      ? (products.data ?? []).find((p) => p._id === editingId)
      : undefined;

  const selectedAssigned = resolveAssignedAttributes(
    editingProduct?.attributes ?? [],
    activeAttributes,
    form.attributeIds,
  );

  useEffect(() => {
    if (mode !== 'create' || slugTouched) return;
    setForm((prev) => ({ ...prev, slug: makeSlug(prev.title) }));
  }, [form.title, mode, slugTouched]);

  useEffect(() => {
    if (mode === 'list') return;

    const productAttrs = editingProduct?.attributes ?? [];
    const assigned = resolveAssignedAttributes(
      productAttrs,
      activeAttributes,
      form.attributeIds,
    );

    setVariantRows((prev) =>
      rebuildRowsForAttributes(
        assigned,
        form.title,
        prev,
        mode === 'edit' ? loadedVariants : [],
      ),
    );
  }, [
    form.attributeIds.join(','),
    mode,
    attributes.data,
    loadedVariants,
    form.title,
    editingId,
    products.data,
  ]);

  useEffect(() => {
    if (mode !== 'create' || selectedAssigned.length !== 1) return;
    setVariantRows((prev) =>
      rebuildRowsForAttributes(selectedAssigned, form.title, prev).map((row) => {
        const key = row.attrValues[selectedAssigned[0].name];
        const prevRow = prev.find((p) => p.attrValues[selectedAssigned[0].name] === key);
        return prevRow
          ? { ...row, price: prevRow.price, stock: prevRow.stock, enabled: prevRow.enabled, sku: prevRow.sku }
          : row;
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.title]);

  useEffect(() => {
    if (mode === 'list') {
      gallery.reset();
      thumbnail.reset();
      ogImage.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    setSubmitting(true);
    setError('');

    const duplicateVariants = validateUniqueVariantRows(variantRows, selectedAssigned);
    if (duplicateVariants) {
      setError(duplicateVariants);
      setSubmitting(false);
      return;
    }

    const alt = form.title.trim() || 'Product image';
    const ogAlt = form.ogTitle.trim() || form.seoTitle.trim() || alt;

    const seoPayload = {
      seoTitle: form.seoTitle,
      seoDescription: form.seoDescription,
      ogTitle: form.ogTitle,
      ogDescription: form.ogDescription,
    };

    const badgePayload = {
      isFeatured: form.isFeatured,
      isBestSeller: form.isBestSeller,
      offerType: form.offerType,
      offerValue: form.offerType === 'none' ? 0 : form.offerValue,
    };

    try {
      if (mode === 'create') {
        let uploadedIds: string[] = [];
        try {
          const resolved = await resolveProductImagesForCreate(thumbnail, gallery, token, alt);
          uploadedIds = resolved.newUploadedIds;

          const resolvedOg = await resolveSingleImageForCreate(ogImage, token, ogAlt);
          uploadedIds = [...uploadedIds, ...resolvedOg.newUploadedIds];

          const created = await apiFetch<Product>('/api/v1/product', {
            method: 'POST',
            token,
            body: JSON.stringify({
              title: form.title,
              ...(form.slug.trim() ? { slug: form.slug.trim() } : {}),
              shortDescription: form.shortDescription,
              description: form.description,
              category: form.category,
              ...(form.brandId ? { brand: form.brandId } : {}),
              averageRating: form.averageRating || 0,
              status: form.status,
              attributes: form.attributeIds,
              ...(resolved.thumbnail ? { thumbnail: resolved.thumbnail } : {}),
              ...(resolvedOg.id ? { ogImage: resolvedOg.id } : {}),
              gallery: resolved.gallery,
              ...seoPayload,
              ...badgePayload,
            }),
          });
          if (variantRows.some((r) => r.enabled)) {
            await createVariantsForProduct(created._id, variantRows, selectedAssigned, token);
          }
        } catch (err) {
          if (uploadedIds.length) {
            await rollbackUploadedMedia(uploadedIds, token);
          }
          throw err;
        }
      } else if (mode === 'edit' && editingId) {
        let newUploadedIds: string[] = [];
        try {
          const resolved = await resolveProductImagesForUpdate(thumbnail, gallery, token, alt);
          newUploadedIds = resolved.newUploadedIds;

          const resolvedOg = await resolveSingleImageForUpdate(ogImage, token, ogAlt);
          newUploadedIds = [...newUploadedIds, ...resolvedOg.newUploadedIds];

          await apiFetch(`/api/v1/product/${editingId}`, {
            method: 'PATCH',
            token,
            body: JSON.stringify({
              title: form.title,
              ...(form.slug.trim() ? { slug: form.slug.trim() } : {}),
              shortDescription: form.shortDescription,
              description: form.description,
              category: form.category,
              brand: form.brandId || null,
              averageRating: form.averageRating || 0,
              status: form.status,
              attributes: form.attributeIds,
              ...(resolved.thumbnail !== undefined ? { thumbnail: resolved.thumbnail } : {}),
              ...(resolvedOg.id !== undefined ? { ogImage: resolvedOg.id } : {}),
              gallery: resolved.gallery,
              ...seoPayload,
              ...badgePayload,
            }),
          });
          await syncVariantsForProduct(
            editingId,
            variantRows,
            selectedAssigned,
            token,
            existingVariantIds,
          );
        } catch (err) {
          if (newUploadedIds.length) {
            await rollbackUploadedMedia(newUploadedIds, token);
          }
          throw err;
        }
      }

      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSubmitting(false);
    }
  }

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Product['status'] }) =>
      apiFetch(`/api/v1/product/${id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'products'] }),
  });

  const updateAttributes = useMutation({
    mutationFn: ({ id, attributeIds }: { id: string; attributeIds: string[] }) =>
      apiFetch(`/api/v1/product/${id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ attributes: attributeIds }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      setEditingAttributesId(null);
      setSelectedAttributeIds([]);
    },
  });

  const deleteProduct = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/v1/product/${id}`, { method: 'DELETE', token }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'products'] }),
  });

  function AttributeCheckboxes({
    selected,
    onChange,
  }: {
    selected: string[];
    onChange: (ids: string[]) => void;
  }) {
    if (!activeAttributes.length) {
      return (
        <p className="text-sm text-zinc-500">
          No attributes yet.{' '}
          <a href="/admin/attributes" className="underline">
            Create attributes
          </a>{' '}
          first.
        </p>
      );
    }
    return (
      <div className="flex flex-wrap gap-3">
        {activeAttributes.map((attr) => (
          <label key={attr._id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(attr._id)}
              onChange={() => toggleAttribute(attr._id, selected, onChange)}
            />
            <span>
              {attr.name}{' '}
              <span className="text-zinc-400">({attr.values.join(', ')})</span>
            </span>
          </label>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-zinc-500">
            Select thumbnail + gallery for preview; they upload when you save.
          </p>
        </div>
        {mode === 'list' ? (
          <Button onClick={startCreate}>New product</Button>
        ) : (
          <Button variant="secondary" onClick={closeForm}>
            Cancel
          </Button>
        )}
      </div>

      {mode !== 'list' ? (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-zinc-200 p-4">
          <h2 className="font-medium">{mode === 'create' ? 'Create product' : 'Edit product'}</h2>

          <ProductThumbnailPicker thumbnail={thumbnail} />
          <ProductImagePicker gallery={gallery} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <Input
              label="Slug"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm({ ...form, slug: e.target.value });
              }}
              placeholder="product-url-slug"
              required
            />
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Category</span>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              >
                <option value="">Select category</option>
                {(categories.data ?? []).map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.categoryName}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Brand (optional)</span>
              <select
                value={form.brandId}
                onChange={(e) => setForm({ ...form, brandId: e.target.value })}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              >
                <option value="">No brand</option>
                {(brands.data ?? []).map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.brandName}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <Input
            label="Rating (0–5, optional)"
            type="number"
            min={0}
            max={5}
            step={0.1}
            value={form.averageRating || ''}
            onChange={(e) => setForm({ ...form, averageRating: Number(e.target.value) || 0 })}
          />

          <Input
            label="Short description"
            value={form.shortDescription}
            onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
          />

          <RichTextEditor
            label="Description"
            value={form.description}
            onChange={(description) => setForm({ ...form, description })}
            placeholder="Full product details, specs, care instructions…"
          />

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Status</span>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as Product['status'] })}
              className="w-full max-w-xs rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>

          <div className="space-y-2">
            <span className="text-sm font-medium">Attributes</span>
            <AttributeCheckboxes
              selected={form.attributeIds}
              onChange={(ids) => setForm({ ...form, attributeIds: ids })}
            />
          </div>

          <ProductVariantSetup
            assigned={selectedAssigned}
            rows={variantRows}
            onChange={setVariantRows}
            productTitle={form.title}
          />

          <div className="space-y-4 rounded-lg border border-zinc-200 p-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Tags & offer</h3>
              <p className="text-xs text-zinc-500">
                Stickers appear on the product image in shop listings.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                />
                Featured
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isBestSeller}
                  onChange={(e) => setForm({ ...form, isBestSeller: e.target.checked })}
                />
                Best seller
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Offer type</span>
                <select
                  value={form.offerType ?? 'none'}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      offerType: e.target.value as Product['offerType'],
                      ...(e.target.value === 'none' ? { offerValue: 0 } : {}),
                    })
                  }
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                >
                  <option value="none">No offer</option>
                  <option value="percent">Percent off</option>
                  <option value="fixed">Fixed amount off (BDT)</option>
                </select>
              </label>

              {form.offerType && form.offerType !== 'none' ? (
                <Input
                  label={form.offerType === 'percent' ? 'Discount (%)' : 'Discount amount (BDT)'}
                  type="number"
                  min={form.offerType === 'percent' ? 1 : 1}
                  max={form.offerType === 'percent' ? 100 : undefined}
                  step={form.offerType === 'percent' ? 1 : 0.01}
                  value={form.offerValue || ''}
                  onChange={(e) =>
                    setForm({ ...form, offerValue: Number(e.target.value) || 0 })
                  }
                  placeholder={form.offerType === 'percent' ? 'e.g. 20' : 'e.g. 500'}
                />
              ) : null}
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">SEO</h3>
              <p className="text-xs text-zinc-500">
                Separate from product content. Example title:{' '}
                <span className="font-medium">{`Product name | ${SITE_NAME}`}</span>
              </p>
            </div>

            <Input
              label="Meta title (browser tab / Google)"
              value={form.seoTitle}
              onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
              placeholder={`e.g. Summer T-Shirt | ${SITE_NAME}`}
            />

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Meta description</span>
              <textarea
                value={form.seoDescription}
                onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                rows={2}
                placeholder="Search result summary (120–160 characters recommended)"
              />
            </label>

            <div className="border-t border-zinc-200 pt-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
                Open Graph (social share)
              </p>
              <div className="space-y-4">
                <Input
                  label="OG title"
                  value={form.ogTitle}
                  onChange={(e) => setForm({ ...form, ogTitle: e.target.value })}
                  placeholder="Title shown when shared on Facebook, WhatsApp, etc."
                />

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium">OG description</span>
                  <textarea
                    value={form.ogDescription}
                    onChange={(e) => setForm({ ...form, ogDescription: e.target.value })}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                    rows={2}
                    placeholder="Description shown on social previews"
                  />
                </label>

                <ProductThumbnailPicker
                  thumbnail={ogImage}
                  label="OG image"
                  description="Share image for social media (separate from product thumbnail)."
                />
              </div>
            </div>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : mode === 'create' ? 'Create product' : 'Update product'}
          </Button>
        </form>
      ) : null}

      {products.isLoading ? (
        <p>Loading…</p>
      ) : (
        <div className="space-y-4">
          {(products.data ?? []).map((p) => (
            <div key={p._id} className="rounded-xl border border-zinc-200 p-4">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getProductThumbnailUrl(p)}
                    alt=""
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                  {(p.gallery?.length ?? 0) > 0 ? (
                    <span className="self-center text-xs text-zinc-500">
                      +{p.gallery!.length} gallery
                    </span>
                  ) : null}
                </div>

                <div className="flex-1">
                  <p className="font-medium">{p.title}</p>
                  <p className="text-xs text-zinc-500">{p.slug}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(p.attributes ?? []).length === 0 ? (
                      <span className="text-xs text-amber-600">No attributes assigned</span>
                    ) : (
                      p.attributes!.map((a) => (
                        <span key={a._id} className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs">
                          {a.name}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={p.status}
                    onChange={(e) =>
                      updateStatus.mutate({ id: p._id, status: e.target.value as Product['status'] })
                    }
                    className="rounded border border-zinc-300 px-2 py-1 text-xs"
                  >
                    <option value="draft">draft</option>
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </select>
                  <span className="text-sm">
                    {formatPrice(p.minPrice)} · stock {p.totalStock ?? 0}
                  </span>
                  <Button variant="secondary" onClick={() => startEdit(p)}>
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditingAttributesId(editingAttributesId === p._id ? null : p._id);
                      setSelectedAttributeIds((p.attributes ?? []).map((a) => a._id));
                    }}
                  >
                    Attributes
                  </Button>
                  <Button variant="danger" onClick={() => deleteProduct.mutate(p._id)}>
                    Delete
                  </Button>
                </div>
              </div>

              {editingAttributesId === p._id ? (
                <div className="mt-4 space-y-3 border-t border-zinc-100 pt-4">
                  <AttributeCheckboxes
                    selected={selectedAttributeIds}
                    onChange={setSelectedAttributeIds}
                  />
                  <Button
                    onClick={() =>
                      updateAttributes.mutate({ id: p._id, attributeIds: selectedAttributeIds })
                    }
                    disabled={updateAttributes.isPending}
                  >
                    Save attributes
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
