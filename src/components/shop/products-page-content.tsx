import Link from 'next/link';
import { ProductCard } from '@/components/shop/product-card';
import { ShopMobileFilterSheet } from '@/components/shop/shop-mobile-filter-sheet';
import {
  buildProductsPageUrl,
  parseCsvParam,
  ShopSidebarFilters,
  type ShopSearchParams,
} from '@/components/shop/shop-filters';
import { ShopSortBar } from '@/components/shop/shop-sort-bar';
import type { Brand, Category, ProductListResult } from '@/types';

type Props = {
  products: ProductListResult;
  categories: Category[];
  brands: Brand[];
  activeCategory: Category | null;
  params: ShopSearchParams;
};

export function ProductsPageContent({
  products,
  categories,
  brands,
  activeCategory,
  params,
}: Props) {
  const page = Number(params.page ?? 1) || 1;

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
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
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
