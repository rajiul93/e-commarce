import { apiFetch } from '@/lib/api';
import type { VariantDraftRow } from '@/lib/variant-draft';
import { enabledRows } from '@/lib/variant-draft';
import type { Attribute } from '@/types';

function toVariantBody(productId: string, row: VariantDraftRow) {
  return {
    productId,
    sku: row.sku.trim(),
    price: row.price,
    buyPrice: row.buyPrice ?? 0,
    stock: row.stock,
    status: 'active' as const,
    attributes: Object.entries(row.attrValues).map(([name, value]) => ({ name, value })),
  };
}

export async function syncVariantsForProduct(
  productId: string,
  rows: VariantDraftRow[],
  assigned: Attribute[],
  token: string,
  existingVariantIds: string[],
): Promise<void> {
  const active = enabledRows(rows, assigned);
  const keptIds = new Set<string>();

  for (const row of active) {
    const body = toVariantBody(productId, row);
    if (row.variantId) {
      await apiFetch(`/api/v1/variant/${row.variantId}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify(body),
      });
      keptIds.add(row.variantId);
    } else {
      const created = await apiFetch<{ _id: string }>('/api/v1/variant', {
        method: 'POST',
        token,
        body: JSON.stringify(body),
      });
      keptIds.add(created._id);
    }
  }

  for (const id of existingVariantIds) {
    if (!keptIds.has(id)) {
      await apiFetch(`/api/v1/variant/${id}`, { method: 'DELETE', token });
    }
  }
}

export async function createVariantsForProduct(
  productId: string,
  rows: VariantDraftRow[],
  assigned: Attribute[],
  token: string,
): Promise<void> {
  for (const row of enabledRows(rows, assigned)) {
    await apiFetch('/api/v1/variant', {
      method: 'POST',
      token,
      body: JSON.stringify(toVariantBody(productId, row)),
    });
  }
}
