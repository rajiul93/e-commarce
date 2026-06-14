'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { Brand, Category } from '@/types';
import {
  buildShopQuery,
  parseCsvParam,
  toCsvParam,
  type ShopSearchParams,
} from '@/components/shop/shop-filters';
import { PriceRangeSlider } from '@/components/shop/price-range-slider';

const PRICE_MAX = 50000;
const PRICE_STEP = 100;

const RATING_OPTIONS = [
  { value: 4, label: '4+ stars' },
  { value: 3, label: '3+ stars' },
  { value: 2, label: '2+ stars' },
  { value: 1, label: '1+ stars' },
] as const;

function FilterCheckboxGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <fieldset className="space-y-2 text-sm">
      <legend className="font-medium">{title}</legend>
      {options.length === 0 ? (
        <p className="text-xs text-zinc-500">No options available</p>
      ) : (
        <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto pr-1">
          {options.map((opt) => (
            <label
              key={opt.id}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-0.5 hover:bg-white/80"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt.id)}
                onChange={() => onToggle(opt.id)}
                className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
              />
              <span className="text-zinc-700">{opt.label}</span>
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}

export function ShopFilterPanel({
  categories,
  brands,
  params,
  onApplied,
}: {
  categories: Category[];
  brands: Brand[];
  params: ShopSearchParams;
  onApplied?: () => void;
}) {
  const router = useRouter();
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    () => parseCsvParam(params.category),
  );
  const [selectedBrands, setSelectedBrands] = useState<string[]>(() => parseCsvParam(params.brand));
  const [minPrice, setMinPrice] = useState(Number(params.minPrice) || 0);
  const [maxPrice, setMaxPrice] = useState(
    params.maxPrice ? Number(params.maxPrice) : PRICE_MAX,
  );
  const [minRating, setMinRating] = useState(Number(params.minRating) || 0);

  useEffect(() => {
    setSelectedCategories(parseCsvParam(params.category));
    setSelectedBrands(parseCsvParam(params.brand));
    setMinPrice(Number(params.minPrice) || 0);
    setMaxPrice(params.maxPrice ? Number(params.maxPrice) : PRICE_MAX);
    setMinRating(Number(params.minRating) || 0);
  }, [params.brand, params.category, params.maxPrice, params.minPrice, params.minRating]);

  const navigateFilters = useCallback(
    (patch: Record<string, string | undefined>) => {
      router.replace(buildShopQuery(params, { ...patch, page: undefined }));
      onApplied?.();
    },
    [onApplied, params, router],
  );

  const applyPriceAndRating = useCallback(() => {
    const safeMin = Math.min(minPrice, maxPrice);
    const safeMax = Math.max(minPrice, maxPrice);

    navigateFilters({
      category: toCsvParam(selectedCategories),
      brand: toCsvParam(selectedBrands),
      minPrice: safeMin > 0 ? String(safeMin) : undefined,
      maxPrice: safeMax < PRICE_MAX ? String(safeMax) : undefined,
      minRating: minRating > 0 ? String(minRating) : undefined,
    });
  }, [
    maxPrice,
    minPrice,
    minRating,
    navigateFilters,
    selectedBrands,
    selectedCategories,
  ]);

  function toggleCategory(id: string) {
    const next = selectedCategories.includes(id)
      ? selectedCategories.filter((x) => x !== id)
      : [...selectedCategories, id];
    setSelectedCategories(next);
    navigateFilters({ category: toCsvParam(next) });
  }

  function toggleBrand(id: string) {
    const next = selectedBrands.includes(id)
      ? selectedBrands.filter((x) => x !== id)
      : [...selectedBrands, id];
    setSelectedBrands(next);
    navigateFilters({ brand: toCsvParam(next) });
  }

  function toggleRating(value: number) {
    const next = minRating === value ? 0 : value;
    setMinRating(next);
    navigateFilters({ minRating: next > 0 ? String(next) : undefined });
  }

  return (
    <div className="space-y-5">
      <FilterCheckboxGroup
        title="Category"
        options={categories.map((cat) => ({ id: cat._id, label: cat.categoryName }))}
        selected={selectedCategories}
        onToggle={toggleCategory}
      />

      <FilterCheckboxGroup
        title="Brand"
        options={brands.map((b) => ({ id: b._id, label: b.brandName }))}
        selected={selectedBrands}
        onToggle={toggleBrand}
      />

      <div className="space-y-2 text-sm">
        <span className="font-medium">Price</span>
        <PriceRangeSlider
          min={0}
          max={PRICE_MAX}
          step={PRICE_STEP}
          minValue={minPrice}
          maxValue={maxPrice}
          onMinChange={setMinPrice}
          onMaxChange={setMaxPrice}
        />
      </div>

      <fieldset className="space-y-2 text-sm">
        <legend className="font-medium">Rating</legend>
        <div className="flex flex-col gap-1.5">
          {RATING_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-0.5 hover:bg-white/80"
            >
              <input
                type="checkbox"
                checked={minRating === opt.value}
                onChange={() => toggleRating(opt.value)}
                className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
              />
              <span className="text-zinc-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2 pt-1">
        <button
          type="button"
          onClick={applyPriceAndRating}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Apply price
        </button>
        <Link
          href="/products"
          onClick={onApplied}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-center text-sm hover:bg-zinc-100"
        >
          Clear all
        </Link>
      </div>
    </div>
  );
}
