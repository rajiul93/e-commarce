'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { ProductCard } from '@/components/shop/product-card';
import { ShopMobileFilterSheet } from '@/components/shop/shop-mobile-filter-sheet';
import { ShopSidebarFilters } from '@/components/shop/shop-filters';
import { ShopSortBar } from '@/components/shop/shop-sort-bar';
import {
  buildProductsPageUrl,
  paramsFromSearchKey,
  parseCsvParam,
} from '@/components/shop/shop-filters';
import {
  fetchShopBrands,
  fetchShopCategories,
  fetchShopCategory,
  fetchShopProducts,
  shopParamsToQuery,
  shopQueryKeys,
} from '@/lib/shop-api';

function ProductsPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-9 w-48 rounded-lg bg-zinc-200" />
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="hidden h-[28rem] w-full rounded-2xl bg-zinc-200 lg:block lg:w-60" />
        <div className="min-w-0 flex-1 space-y-6">
          <div className="h-11 rounded-xl bg-zinc-200" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl bg-zinc-200">
                <div className="aspect-[4/5] bg-zinc-300" />
                <div className="space-y-2 p-4">
                  <div className="h-3 w-16 rounded bg-zinc-300" />
                  <div className="h-4 w-full rounded bg-zinc-300" />
                  <div className="h-5 w-24 rounded bg-zinc-300" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductsPageContent() {
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();
  const params = useMemo(() => paramsFromSearchKey(searchKey), [searchKey]);
  const categoryIds = useMemo(() => parseCsvParam(params.category), [params.category]);
  const page = Number(params.page ?? 1) || 1;

  const [productsResult, categoriesResult, brandsResult, categoryResult] = useQueries({
    queries: [
      {
        queryKey: shopQueryKeys.products(searchKey),
        queryFn: () => fetchShopProducts(shopParamsToQuery(paramsFromSearchKey(searchKey))),
        staleTime: 0,
      },
      {
        queryKey: shopQueryKeys.categories(),
        queryFn: fetchShopCategories,
      },
      {
        queryKey: shopQueryKeys.brands(),
        queryFn: fetchShopBrands,
      },
      {
        queryKey: shopQueryKeys.category(categoryIds[0] ?? ''),
        queryFn: () => fetchShopCategory(categoryIds[0]!),
        enabled: categoryIds.length === 1,
      },
    ],
  });

  const isLoading =
    productsResult.isLoading || categoriesResult.isLoading || brandsResult.isLoading;
  const isFiltering = productsResult.isFetching && !productsResult.isLoading;

  if (isLoading) {
    return <ProductsPageSkeleton />;
  }

  const products = productsResult.data ?? {
    items: [],
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0,
  };
  const categories = categoriesResult.data ?? [];
  const brands = brandsResult.data ?? [];
  const activeCategory = categoryResult.data ?? null;

  const hasError = productsResult.isError || categoriesResult.isError || brandsResult.isError;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-widest text-zinc-400">Browse</p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          {activeCategory ? activeCategory.categoryName : 'All products'}
        </h1>
        {products.total > 0 ? (
          <p className="text-sm text-zinc-500">
            {products.total} product{products.total === 1 ? '' : 's'} available
          </p>
        ) : null}
      </div>

      {hasError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not load products. Please refresh the page.
        </p>
      ) : null}

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="w-full shrink-0 lg:w-60">
          <ShopSidebarFilters categories={categories} brands={brands} params={params} />
        </div>

        <div className="min-w-0 flex-1 space-y-6">
          <ShopSortBar
            params={params}
            total={products.total}
            filterSlot={
              <ShopMobileFilterSheet categories={categories} brands={brands} params={params} />
            }
          />

          {products.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-16 text-center">
              <p className="text-lg font-medium text-zinc-800">No products found</p>
              <p className="mt-1 text-sm text-zinc-500">Try adjusting your filters or search criteria.</p>
            </div>
          ) : (
            <div
              className={`grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 ${
                isFiltering ? 'opacity-50' : ''
              }`}
            >
              {products.items.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          {products.totalPages > 1 ? (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {Array.from({ length: products.totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={buildProductsPageUrl(params, p)}
                  className={`min-w-9 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    p === page
                      ? 'bg-zinc-900 text-white shadow-sm'
                      : 'border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
                  }`}
                >
                  {p}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
