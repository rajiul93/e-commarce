import { apiClient } from '@/lib/axios';
import type { Brand, Category, ProductListResult } from '@/types';
import {
  shopParamsToQuery,
  type ShopProductsQuery,
  type ShopSearchParams,
} from '@/components/shop/shop-filters';

export type { ShopProductsQuery };

export const shopQueryKeys = {
  products: (searchKey: string) => ['shop', 'products', searchKey] as const,
  categories: () => ['shop', 'categories'] as const,
  brands: () => ['shop', 'brands'] as const,
  category: (id: string) => ['shop', 'category', id] as const,
};

export { shopParamsToQuery };

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

export type { ShopSearchParams };
