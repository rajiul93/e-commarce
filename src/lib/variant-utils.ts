import type { Attribute, Variant } from '@/types';

export type AttributeAxis = {
  name: string;
  values: string[];
};

/** Prefer product attribute catalogue; fall back to variant rows when catalogue is empty. */
export function resolveVariantAxes(
  activeVariants: Variant[],
  productAttributes: Attribute[] = [],
): AttributeAxis[] {
  const fromCatalog = productAttributes
    .filter((a) => a.status === 'active')
    .map((a) => ({ name: a.name, values: [...a.values] }));

  if (fromCatalog.length) return fromCatalog;
  if (activeVariants.length) return getVariantAxes(activeVariants);
  return [];
}

/** Build selectable axes (Size, Color, …) from variant rows. */
export function getVariantAxes(variants: Variant[]): AttributeAxis[] {
  const map = new Map<string, Set<string>>();

  for (const variant of variants) {
    for (const attr of variant.attributes) {
      const set = map.get(attr.name) ?? new Set<string>();
      set.add(attr.value);
      map.set(attr.name, set);
    }
  }

  return [...map.entries()]
    .map(([name, values]) => ({ name, values: [...values].sort() }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Find variant matching all selected attribute pairs. */
export function findVariantBySelection(
  variants: Variant[],
  selection: Record<string, string>,
): Variant | undefined {
  const entries = Object.entries(selection).filter(([, v]) => v);
  if (!entries.length) return undefined;

  return variants.find((variant) =>
    entries.every(([name, value]) =>
      variant.attributes.some((a) => a.name === name && a.value === value),
    ),
  );
}

/** Values still available for an axis given partial selection. */
export function getAvailableValues(
  variants: Variant[],
  axisName: string,
  selection: Record<string, string>,
): string[] {
  const others = Object.entries(selection).filter(([n, v]) => n !== axisName && v);
  const matching = variants.filter((variant) =>
    others.every(([name, value]) =>
      variant.attributes.some((a) => a.name === name && a.value === value),
    ),
  );

  const values = new Set<string>();
  for (const variant of matching) {
    const attr = variant.attributes.find((a) => a.name === axisName);
    if (attr && variant.status === 'active') {
      values.add(attr.value);
    }
  }
  return [...values].sort();
}

/** Whether a partial selection resolves to an in-stock active variant. */
export function isVariantValueInStock(
  variants: Variant[],
  axisName: string,
  value: string,
  selection: Record<string, string>,
): boolean {
  const testSelection = { ...selection, [axisName]: value };
  const variant = findVariantBySelection(variants, testSelection);
  return Boolean(variant && variant.stock > 0);
}

export function formatVariantLabel(variant: Variant): string {
  return variant.attributes.map((a) => `${a.name}: ${a.value}`).join(' · ') || variant.sku;
}

export type AttributePair = { name: string; value: string };

export function normalizeAttributePairs(
  attrs: AttributePair[] | Variant['attributes'],
): AttributePair[] {
  return attrs.map((a) => ({ name: a.name.trim(), value: a.value.trim() }));
}

/** Canonical key for comparing variant attribute combinations. */
export function attributeCombinationKey(
  attrs: AttributePair[] | Record<string, string>,
): string {
  const pairs = Array.isArray(attrs)
    ? normalizeAttributePairs(attrs)
    : Object.entries(attrs)
        .filter(([, value]) => value.trim())
        .map(([name, value]) => ({ name: name.trim(), value: value.trim() }));

  return pairs
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((a) => `${a.name.toLowerCase()}:${a.value.toLowerCase()}`)
    .join('|');
}

export function variantsShareAttributes(
  a: AttributePair[] | Variant['attributes'],
  b: AttributePair[] | Variant['attributes'],
): boolean {
  return attributeCombinationKey(a) === attributeCombinationKey(b);
}

export function findVariantWithAttributes(
  variants: Variant[],
  attrs: AttributePair[] | Record<string, string>,
  excludeVariantId?: string,
): Variant | undefined {
  const key = attributeCombinationKey(attrs);
  return variants.find(
    (v) => v._id !== excludeVariantId && attributeCombinationKey(v.attributes) === key,
  );
}
