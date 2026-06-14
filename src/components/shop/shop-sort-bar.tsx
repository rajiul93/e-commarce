'use client';

import { buildShopQuery, type ShopSearchParams } from '@/components/shop/shop-filters';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'rating_desc', label: 'Rating: high to low' },
  { value: 'rating_asc', label: 'Rating: low to high' },
] as const;

export function ShopSortBar({
  params,
  total,
  filterSlot,
}: {
  params: ShopSearchParams;
  total: number;
  filterSlot?: ReactNode;
}) {
  const router = useRouter();
  const sort = params.sort ?? 'newest';

  function handleSortChange(nextSort: string) {
    router.replace(buildShopQuery(params, { sort: nextSort, page: undefined }));
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-4">
      <div className="flex items-center gap-2">
        {filterSlot}
        <p className="text-sm text-zinc-500">{total} products</p>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <span className="font-medium text-zinc-700">Sort by</span>
        <select
          value={sort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
