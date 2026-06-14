import { apiClient } from '@/lib/axios';
import type { Brand, Category, ProductListResult } from '@/types';
import type { ShopSearchParams } from '@/components/shop/shop-filters';

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

export const shopQueryKeys = {
  products: (searchKey: string) => ['shop', 'products', searchKey] as const,
  categories: () => ['shop', 'categories'] as const,
  brands: () => ['shop', 'brands'] as const,
  category: (id: string) => ['shop', 'category', id] as const,
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

export async function fetchShopProducts(query: ShopProductsQuery): Promise<ProductListResult> {
  const { data } = await apiClient.get<ProductListResult>('/api/v1/product', { params: query });
  return (
    data ?? {
      items: [],
      total: 0,
      page: query.page ?? 1,
      limit: query.limit ?? 12,
      totalPages: 0,
    }
  );
}

export async function fetchShopCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>('/api/v1/category');
  return data ?? [];
}

export async function fetchShopBrands(): Promise<Brand[]> {
  const { data } = await apiClient.get<Brand[]>('/api/v1/brand');
  return data ?? [];
}

export async function fetchShopCategory(id: string): Promise<Category | null> {
  try {
    const { data } = await apiClient.get<Category>(`/api/v1/category/${id}`);
    return data ?? null;
  } catch {
    return null;
  }
}
