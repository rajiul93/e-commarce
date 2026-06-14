import type {
  ApiResponse,
  Brand,
  BrandingSettings,
  Category,
  Collection,
  HomeHeroSettings,
  OrderSettings,
  Product,
  ProductListResult,
} from '@/types';
import { apiUrl } from '@/lib/api-base';

async function serverFetch<T>(path: string, revalidate = 60): Promise<T | null> {
  try {
    const res = await fetch(apiUrl(path), {
      next: { revalidate },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as ApiResponse<T>;
    return json.data;
  } catch {
    return null;
  }
}

export async function getCategories(): Promise<Category[]> {
  return (await serverFetch<Category[]>('/api/v1/category')) ?? [];
}

export async function getProducts(params?: {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'rating_asc' | 'rating_desc';
  page?: number;
  limit?: number;
}): Promise<ProductListResult> {
  const search = new URLSearchParams();
  if (params?.category) search.set('category', params.category);
  if (params?.brand) search.set('brand', params.brand);
  if (params?.minPrice !== undefined) search.set('minPrice', String(params.minPrice));
  if (params?.maxPrice !== undefined) search.set('maxPrice', String(params.maxPrice));
  if (params?.minRating !== undefined) search.set('minRating', String(params.minRating));
  if (params?.sort) search.set('sort', params.sort);
  if (params?.page) search.set('page', String(params.page));
  if (params?.limit) search.set('limit', String(params.limit));
  const qs = search.toString();
  return (
    (await serverFetch<ProductListResult>(
      `/api/v1/product${qs ? `?${qs}` : ''}`,
    )) ?? { items: [], total: 0, page: 1, limit: 20, totalPages: 0 }
  );
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return serverFetch<Product>(`/api/v1/product/by-slug/${encodeURIComponent(slug)}`);
}

export async function getProductSlugs(): Promise<string[]> {
  return (await serverFetch<string[]>('/api/v1/product/slugs')) ?? [];
}

export async function getCategory(id: string): Promise<Category | null> {
  return serverFetch<Category>(`/api/v1/category/${id}`);
}

export async function getOrderSettings(): Promise<OrderSettings> {
  return (
    (await serverFetch<OrderSettings>('/api/v1/settings/order')) ?? {
      loggedInCheckout: true,
      guestQuickOrder: true,
      couponScope: 'all_products',
    }
  );
}

export async function getHomeCollections(): Promise<Collection[]> {
  try {
    const res = await fetch(apiUrl('/api/v1/collection?forHome=true'), {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const json = (await res.json()) as ApiResponse<Collection[]>;
    return json.data ?? [];
  } catch {
    return [];
  }
}

export async function getHomeHero(): Promise<HomeHeroSettings | null> {
  return serverFetch<HomeHeroSettings>('/api/v1/settings/home-hero');
}

export async function getBranding(): Promise<BrandingSettings> {
  try {
    const res = await fetch(apiUrl('/api/v1/settings/branding'), { cache: 'no-store' });
    if (!res.ok) {
      return {
        siteName: process.env.NEXT_PUBLIC_SITE_NAME?.trim() || 'Shop',
        logo: null,
      };
    }
    const json = (await res.json()) as ApiResponse<BrandingSettings>;
    return (
      json.data ?? {
        siteName: process.env.NEXT_PUBLIC_SITE_NAME?.trim() || 'Shop',
        logo: null,
      }
    );
  } catch {
    return {
      siteName: process.env.NEXT_PUBLIC_SITE_NAME?.trim() || 'Shop',
      logo: null,
    };
  }
}

export async function getBrands(): Promise<Brand[]> {
  try {
    const res = await fetch(apiUrl('/api/v1/brand'), { cache: 'no-store' });
    if (!res.ok) return [];
    const json = (await res.json()) as ApiResponse<Brand[]>;
    return json.data ?? [];
  } catch {
    return [];
  }
}
