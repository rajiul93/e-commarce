import type { Attribute, Variant } from '@/types';

export type VariantDraftRow = {
  localId: string;
  attrValues: Record<string, string>;
  price: number;
  buyPrice: number;
  stock: number;
  sku: string;
  enabled: boolean;
  variantId?: string;
};

export function newLocalId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function slugPart(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 20);
}

export function suggestSku(productTitle: string, attrValues: Record<string, string>) {
  const base = slugPart(productTitle) || 'product';
  const parts = Object.values(attrValues).map((v) => slugPart(v)).filter(Boolean);
  return parts.length ? `${base}-${parts.join('-')}`.toUpperCase() : base.toUpperCase();
}

export function assignedAttributes(all: Attribute[], ids: string[]): Attribute[] {
  return ids
    .map((id) => all.find((a) => a._id === id))
    .filter((a): a is Attribute => !!a && a.status === 'active');
}

export function emptyRow(assigned: Attribute[], productTitle: string): VariantDraftRow {
  const attrValues: Record<string, string> = {};
  for (const a of assigned) {
    attrValues[a.name] = '';
  }
  return {
    localId: newLocalId(),
    attrValues,
    price: 0,
    buyPrice: 0,
    stock: 0,
    sku: '',
    enabled: true,
  };
}

function rowFromCombination(
  attrValues: Record<string, string>,
  productTitle: string,
  existing: Variant[] = [],
): VariantDraftRow {
  const match = existing.find((v) =>
    Object.entries(attrValues).every(([name, value]) =>
      v.attributes.some((a) => a.name === name && a.value === value),
    ),
  );

  return {
    localId: newLocalId(),
    attrValues,
    price: match?.price ?? 0,
    buyPrice: match?.buyPrice ?? 0,
    stock: match?.stock ?? 0,
    sku: match?.sku ?? suggestSku(productTitle, attrValues),
    enabled: match ? match.status === 'active' : false,
    variantId: match?._id,
  };
}

export function buildAllCombinations(
  assigned: Attribute[],
  productTitle: string,
  existing: Variant[] = [],
): VariantDraftRow[] {
  if (!assigned.length) return [];

  let combos: Record<string, string>[] = [{}];
  for (const attr of assigned) {
    const next: Record<string, string>[] = [];
    for (const base of combos) {
      for (const value of attr.values) {
        next.push({ ...base, [attr.name]: value });
      }
    }
    combos = next;
  }

  return combos.map((attrValues) => rowFromCombination(attrValues, productTitle, existing));
}

export function buildRowsForSingleAttribute(
  attr: Attribute,
  productTitle: string,
  existing: Variant[] = [],
): VariantDraftRow[] {
  return attr.values.map((value) =>
    rowFromCombination({ [attr.name]: value }, productTitle, existing),
  );
}

export function variantsToRows(
  assigned: Attribute[],
  existing: Variant[],
  productTitle: string,
): VariantDraftRow[] {
  if (!assigned.length) return [];
  if (!existing.length) return [emptyRow(assigned, productTitle)];
  return existing.map((v) => ({
    localId: newLocalId(),
    attrValues: Object.fromEntries(v.attributes.map((a) => [a.name, a.value])),
    price: v.price,
    buyPrice: v.buyPrice ?? 0,
    stock: v.stock,
    sku: v.sku,
    enabled: v.status === 'active',
    variantId: v._id,
  }));
}

export function rebuildRowsForAttributes(
  assigned: Attribute[],
  productTitle: string,
  prev: VariantDraftRow[],
  existing: Variant[] = [],
): VariantDraftRow[] {
  if (!assigned.length) return [];

  const names = assigned.map((a) => a.name).sort().join('|');
  const prevNames = Object.keys(prev[0]?.attrValues ?? {})
    .sort()
    .join('|');

  if (assigned.length === 1) {
    return buildRowsForSingleAttribute(assigned[0], productTitle, existing);
  }

  if (prev.length && names === prevNames) {
    return prev.map((row) => {
      const attrValues = { ...row.attrValues };
      for (const a of assigned) {
        if (!(a.name in attrValues)) attrValues[a.name] = '';
      }
      for (const key of Object.keys(attrValues)) {
        if (!assigned.some((a) => a.name === key)) delete attrValues[key];
      }
      return {
        ...row,
        attrValues,
        sku: row.sku || suggestSku(productTitle, attrValues),
      };
    });
  }

  if (existing.length) {
    return variantsToRows(assigned, existing, productTitle);
  }

  return [emptyRow(assigned, productTitle)];
}

export function enabledRows(rows: VariantDraftRow[], assigned: Attribute[]): VariantDraftRow[] {
  return rows.filter(
    (r) =>
      r.enabled &&
      r.sku.trim() &&
      r.price >= 0 &&
      assigned.every((a) => Boolean(r.attrValues[a.name]?.trim())),
  );
}
