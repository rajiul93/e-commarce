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

export type ShopProductsQuery = {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'rating_asc' | 'rating_desc';
  page?: number;
  limit?: number;
};

export function shopParamsToQuery(params: ShopSearchParams): ShopProductsQuery {
  const page = Number(params.page ?? 1);
  const sort = params.sort as ShopProductsQuery['sort'] | undefined;

  const query: ShopProductsQuery = {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: 12,
  };

  if (params.category?.trim()) query.category = params.category.trim();
  if (params.brand?.trim()) query.brand = params.brand.trim();
  if (params.minPrice != null && params.minPrice !== '') {
    const min = Number(params.minPrice);
    if (Number.isFinite(min)) query.minPrice = min;
  }
  if (params.maxPrice != null && params.maxPrice !== '') {
    const max = Number(params.maxPrice);
    if (Number.isFinite(max)) query.maxPrice = max;
  }
  if (params.minRating != null && params.minRating !== '') {
    const rating = Number(params.minRating);
    if (Number.isFinite(rating)) query.minRating = rating;
  }
  if (sort) query.sort = sort;

  return query;
}

export function searchParamsToShopParams(
  searchParams: Record<string, string | string[] | undefined>,
): ShopSearchParams {
  const get = (key: keyof ShopSearchParams) => {
    const value = searchParams[key];
    if (Array.isArray(value)) return value[0];
    return value;
  };

  return {
    category: get('category'),
    brand: get('brand'),
    minPrice: get('minPrice'),
    maxPrice: get('maxPrice'),
    minRating: get('minRating'),
    sort: get('sort'),
    page: get('page'),
  };
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
