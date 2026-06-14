import type { Brand, Category } from '@/types';
import { ShopFilterPanel } from '@/components/shop/shop-filter-panel';

export type ShopSearchParams = {
  category?: string;
  brand?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
  sort?: string;
  page?: string;
};

export function parseCsvParam(value?: string): string[] {
  if (!value) return [];
  return value.split(',').map((part) => part.trim()).filter(Boolean);
}

export function toCsvParam(values: string[]): string | undefined {
  return values.length > 0 ? values.join(',') : undefined;
}

export function paramsFromSearchParams(searchParams: URLSearchParams): ShopSearchParams {
  return {
    category: searchParams.get('category') ?? undefined,
    brand: searchParams.get('brand') ?? undefined,
    minPrice: searchParams.get('minPrice') ?? undefined,
    maxPrice: searchParams.get('maxPrice') ?? undefined,
    minRating: searchParams.get('minRating') ?? undefined,
    sort: searchParams.get('sort') ?? undefined,
    page: searchParams.get('page') ?? undefined,
  };
}

export function paramsFromSearchKey(searchKey: string): ShopSearchParams {
  return paramsFromSearchParams(new URLSearchParams(searchKey));
}

export function buildShopQuery(base: ShopSearchParams, patch: Record<string, string | undefined>) {
  const next: ShopSearchParams = { ...base };

  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined || value === '') {
      delete next[key as keyof ShopSearchParams];
    } else {
      next[key as keyof ShopSearchParams] = value;
    }
  }

  if (!('page' in patch) || patch.page === undefined) {
    delete next.page;
  }

  const params = new URLSearchParams();
  Object.entries(next).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, value);
  });
  const qs = params.toString();
  return qs ? `/products?${qs}` : '/products';
}

export function buildProductsPageUrl(params: ShopSearchParams, page: number) {
  return buildShopQuery(params, { page: String(page) });
}

export function ShopSidebarFilters({
  categories,
  brands,
  params,
}: {
  categories: Category[];
  brands: Brand[];
  params: ShopSearchParams;
}) {
  return (
    <aside className="hidden space-y-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 lg:block lg:sticky lg:top-8">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Filters</h2>
      </div>
      <ShopFilterPanel categories={categories} brands={brands} params={params} />
    </aside>
  );
}
