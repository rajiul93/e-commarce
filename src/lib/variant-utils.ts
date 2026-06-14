import type { Variant } from '@/types';

export type AttributeAxis = {
  name: string;
  values: string[];
};

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
    if (attr && variant.stock > 0 && variant.status === 'active') {
      values.add(attr.value);
    }
  }
  return [...values].sort();
}

export function formatVariantLabel(variant: Variant): string {
  return variant.attributes.map((a) => `${a.name}: ${a.value}`).join(' · ') || variant.sku;
}
