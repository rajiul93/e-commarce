'use client';

import { formatPrice } from '@/components/shop/product-card';
import { Button } from '@/components/ui/button';
import {
  findVariantBySelection,
  getAvailableValues,
  getVariantAxes,
} from '@/lib/variant-utils';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import type { Attribute, Variant } from '@/types';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export function AddToCartButton({
  productId,
  variants,
  productAttributes = [],
}: {
  productId: string;
  variants: Variant[];
  productAttributes?: Attribute[];
}) {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const [selection, setSelection] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const activeVariants = useMemo(
    () => variants.filter((v) => v.status === 'active'),
    [variants],
  );

  const axes = useMemo(() => {
    if (productAttributes.length) {
      return productAttributes
        .filter((a) => a.status === 'active')
        .map((a) => ({ name: a.name, values: a.values }));
    }
    return getVariantAxes(activeVariants);
  }, [productAttributes, activeVariants]);

  useEffect(() => {
    setSelection({});
  }, [productId]);

  const selectedVariant = findVariantBySelection(activeVariants, selection);
  const allAxesSelected = axes.every((axis) => selection[axis.name]);
  const outOfStock = !selectedVariant || selectedVariant.stock < 1;

  function selectValue(axisName: string, value: string) {
    setSelection((prev) => {
      const next = { ...prev, [axisName]: prev[axisName] === value ? '' : value };
      const axisNames = axes.map((a) => a.name);
      const idx = axisNames.indexOf(axisName);
      for (let i = idx + 1; i < axisNames.length; i += 1) {
        delete next[axisNames[i]];
      }
      return next;
    });
  }

  async function handleAdd() {
    if (!token) {
      router.push('/login');
      return;
    }
    if (!selectedVariant) {
      setMessage('Please select all options');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      await apiFetch('/api/v1/cart/items', {
        method: 'POST',
        token,
        body: JSON.stringify({
          productId,
          variantId: selectedVariant._id,
          quantity,
        }),
      });
      setMessage('Added to cart');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to add');
    } finally {
      setLoading(false);
    }
  }

  if (!activeVariants.length) {
    return <p className="text-red-600">No variants available for this product.</p>;
  }

  return (
    <div className="space-y-4 rounded-xl border border-zinc-200 p-4">
      {axes.map((axis) => {
        const available = getAvailableValues(activeVariants, axis.name, selection);
        return (
          <div key={axis.name} className="space-y-2">
            <span className="text-sm font-medium">{axis.name}</span>
            <div className="flex flex-wrap gap-2">
              {available.map((value) => {
                const isSelected = selection[axis.name] === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => selectValue(axis.name, value)}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                      isSelected
                        ? 'border-zinc-900 bg-zinc-900 text-white'
                        : 'border-zinc-300 hover:border-zinc-900'
                    }`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {selectedVariant && allAxesSelected ? (
        <p className="text-lg font-semibold">{formatPrice(selectedVariant.price)}</p>
      ) : null}

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Quantity</span>
        <input
          type="number"
          min={1}
          max={selectedVariant?.stock ?? 1}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          disabled={!selectedVariant}
          className="w-24 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </label>

      <Button
        onClick={handleAdd}
        disabled={loading || !allAxesSelected || outOfStock}
      >
        {!allAxesSelected
          ? 'Select options'
          : outOfStock
            ? 'Out of stock'
            : loading
              ? 'Adding…'
              : 'Add to cart'}
      </Button>
      {message ? <p className="text-sm text-zinc-600">{message}</p> : null}
    </div>
  );
}
