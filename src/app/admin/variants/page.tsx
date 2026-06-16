'use client';

import { formatPrice } from '@/components/shop/product-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatVariantLabel, findVariantWithAttributes } from '@/lib/variant-utils';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import type { Attribute, Product, Variant } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

type VariantForm = {
  sku: string;
  price: number;
  buyPrice: number;
  stock: number;
  status: 'active' | 'inactive';
  attrValues: Record<string, string>;
};

const emptyForm = (): VariantForm => ({
  sku: '',
  price: 0,
  buyPrice: 0,
  stock: 0,
  status: 'active',
  attrValues: {},
});

export default function AdminVariantsPage() {
  const token = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const [productId, setProductId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VariantForm>(emptyForm());

  const products = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: () => apiFetch<Product[]>('/api/v1/product/admin/all', { token }),
    enabled: !!token,
  });

  const selectedProduct = useMemo(
    () => (products.data ?? []).find((p) => p._id === productId),
    [products.data, productId],
  );

  const productAttributes: Attribute[] = selectedProduct?.attributes ?? [];
  const productAttrKey = productAttributes.map((a) => a._id).join(',');

  const variants = useQuery({
    queryKey: ['admin', 'variants', productId],
    queryFn: () =>
      apiFetch<Variant[]>('/api/v1/variant', { token, params: { productId } }),
    enabled: !!token && !!productId,
  });

  useEffect(() => {
    if (!productAttrKey) return;
    setForm((prev) => {
      const attrValues = { ...prev.attrValues };
      for (const attr of productAttributes) {
        if (!attrValues[attr.name]) attrValues[attr.name] = '';
      }
      return { ...prev, attrValues };
    });
  }, [productId, productAttrKey, productAttributes]);

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm());
  }

  function startEdit(variant: Variant) {
    setEditingId(variant._id);
    const attrValues: Record<string, string> = {};
    for (const a of variant.attributes) attrValues[a.name] = a.value;
    setForm({
      sku: variant.sku,
      price: variant.price,
      buyPrice: variant.buyPrice ?? 0,
      stock: variant.stock,
      status: variant.status,
      attrValues,
    });
  }

  function buildAttributesPayload() {
    return productAttributes.map((attr) => ({
      name: attr.name,
      value: form.attrValues[attr.name] ?? '',
    }));
  }

  const isSingleAttribute = productAttributes.length === 1;
  const missingAttrValues = productAttributes.some((a) => !form.attrValues[a.name]);

  const takenAttributeValues = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const attr of productAttributes) {
      map.set(attr.name, new Set());
    }
    for (const variant of variants.data ?? []) {
      if (variant._id === editingId) continue;
      for (const a of variant.attributes) {
        map.get(a.name)?.add(a.value);
      }
    }
    return map;
  }, [productAttributes, variants.data, editingId]);

  const duplicateCombination = useMemo(() => {
    if (missingAttrValues) return null;
    const attributes = buildAttributesPayload();
    const match = findVariantWithAttributes(variants.data ?? [], attributes, editingId ?? undefined);
    if (!match) return null;
    return `This combination already exists (SKU: ${match.sku}). Each attribute value set can only be used once per product.`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.attrValues, variants.data, editingId, productAttrKey, missingAttrValues]);

  const saveVariant = useMutation({
    mutationFn: () => {
      const attributes = buildAttributesPayload();
      const body = {
        productId,
        sku: form.sku,
        price: form.price,
        buyPrice: form.buyPrice,
        stock: form.stock,
        status: form.status,
        attributes,
      };

      if (editingId) {
        return apiFetch(`/api/v1/variant/${editingId}`, {
          method: 'PATCH',
          token,
          body: JSON.stringify(body),
        });
      }
      return apiFetch('/api/v1/variant', {
        method: 'POST',
        token,
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'variants', productId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      resetForm();
    },
  });

  const deleteVariant = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/v1/variant/${id}`, { method: 'DELETE', token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'variants', productId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Variants</h1>
        <p className="text-sm text-zinc-500">
          1. Create attributes → 2. Assign to product → 3. Add variants with price & stock.
          Each attribute combination can only exist once per product.
        </p>
      </div>

      <label className="block max-w-md space-y-1.5">
        <span className="text-sm font-medium">Product</span>
        <select
          value={productId}
          onChange={(e) => {
            setProductId(e.target.value);
            resetForm();
          }}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        >
          <option value="">Select product</option>
          {(products.data ?? []).map((p) => (
            <option key={p._id} value={p._id}>
              {p.title}
            </option>
          ))}
        </select>
      </label>

      {productId && !productAttributes.length ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          This product has no attributes assigned. Go to{' '}
          <a href="/admin/products" className="font-medium underline">
            Products
          </a>{' '}
          and assign attributes (e.g. Size, Color) before creating variants.
        </div>
      ) : null}

      {productId && productAttributes.length > 0 ? (
        <>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveVariant.mutate();
            }}
            className="space-y-4 rounded-xl border border-zinc-200 p-4"
          >
            <h2 className="font-medium">{editingId ? 'Edit variant' : 'New variant'}</h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {productAttributes.map((attr) => (
                <label key={attr._id} className="block space-y-1.5">
                  <span className="text-sm font-medium">{attr.name}</span>
                  <select
                    value={form.attrValues[attr.name] ?? ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        attrValues: { ...form.attrValues, [attr.name]: e.target.value },
                      })
                    }
                    required
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                  >
                    <option value="">Select {attr.name}</option>
                    {attr.values.map((v) => {
                      const taken =
                        isSingleAttribute &&
                        (takenAttributeValues.get(attr.name)?.has(v) ?? false);
                      return (
                        <option key={v} value={v} disabled={taken}>
                          {v}
                          {taken ? ' (already used)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </label>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Input
                label="SKU"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                required
              />
              <Input
                label="Buy price"
                type="number"
                min={0}
                value={form.buyPrice}
                onChange={(e) => setForm({ ...form, buyPrice: Number(e.target.value) })}
              />
              <Input
                label="Sell price"
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                required
              />
              <Input
                label="Stock"
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                required
              />
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Status</span>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as 'active' | 'inactive' })
                  }
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={saveVariant.isPending || missingAttrValues || Boolean(duplicateCombination)}
              >
                {editingId ? 'Update variant' : 'Add variant'}
              </Button>
              {editingId ? (
                <Button type="button" variant="secondary" onClick={resetForm}>
                  Cancel edit
                </Button>
              ) : null}
            </div>
            {duplicateCombination ? (
              <p className="text-sm text-red-600">{duplicateCombination}</p>
            ) : null}
            {saveVariant.isError ? (
              <p className="text-sm text-red-600">
                {saveVariant.error instanceof Error ? saveVariant.error.message : 'Save failed'}
              </p>
            ) : null}
          </form>

          <div className="overflow-x-auto rounded-xl border border-zinc-200">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50">
                <tr>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Attributes</th>
                  <th className="p-3">Buy</th>
                  <th className="p-3">Sell</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(variants.data ?? []).map((v) => (
                  <tr key={v._id} className="border-b border-zinc-100">
                    <td className="p-3 font-medium">{v.sku}</td>
                    <td className="p-3">{formatVariantLabel(v)}</td>
                    <td className="p-3">{formatPrice(v.buyPrice ?? 0)}</td>
                    <td className="p-3">{formatPrice(v.price)}</td>
                    <td className="p-3">{v.stock}</td>
                    <td className="p-3">{v.status}</td>
                    <td className="p-3 space-x-2">
                      <Button variant="secondary" onClick={() => startEdit(v)}>
                        Edit
                      </Button>
                      <Button variant="danger" onClick={() => deleteVariant.mutate(v._id)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(variants.data ?? []).length === 0 ? (
              <p className="p-4 text-zinc-500">No variants yet for this product.</p>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
