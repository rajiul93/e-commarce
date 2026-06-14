export const revalidate = 60;

import { CategoryImageGrid } from '@/components/shop/category-image-grid';
import { HomeHero } from '@/components/shop/home-hero';
import { ProductCard } from '@/components/shop/product-card';
import { getCategories, getHomeCollections, getHomeHero, getProducts } from '@/lib/server-api';
import type { HomeHeroSettings, Product } from '@/types';
import Link from 'next/link';

const defaultHero: HomeHeroSettings = {
  style: 'slider_only',
  isActive: false,
  slides: [],
  sideItems: [],
};

export default async function HomePage() {
  const [categories, products, collections, heroData] = await Promise.all([
    getCategories(),
    getProducts({ limit: 8 }),
    getHomeCollections(),
    getHomeHero(),
  ]);

  const hero = heroData ?? defaultHero;

  return (
    <div className="space-y-16 pb-4">
      <HomeHero hero={hero} />

      <CategoryImageGrid categories={categories} />

      {collections.map((collection) => {
        const collectionProducts = (collection.products ?? []).filter(
          (p): p is Product => Boolean(p && p.status === 'active'),
        );

        return (
          <section key={collection._id} className="space-y-6">
            {collection.showBannerOnHome && collection.banner?.url ? (
              <div className="overflow-hidden rounded-3xl shadow-sm ring-1 ring-zinc-950/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={collection.banner.url}
                  alt={collection.name}
                  className="h-48 w-full object-cover sm:h-72"
                />
              </div>
            ) : null}
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
                  Collection
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                  {collection.name}
                </h2>
              </div>
            </div>
            {collectionProducts.length === 0 ? (
              <p className="text-sm text-zinc-500">No products in this collection yet.</p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {collectionProducts.map((product) => (
                  <ProductCard key={`${collection._id}-${product._id}`} product={product} />
                ))}
              </div>
            )}
          </section>
        );
      })}

      <section className="rounded-3xl bg-zinc-50 p-6 sm:p-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
              New arrivals
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              Featured products
            </h2>
            <p className="mt-2 max-w-lg text-sm text-zinc-500">
              Fresh picks with fast add-to-cart — in-stock items ship ready.
            </p>
          </div>
          <Link
            href="/products"
            className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            View all
          </Link>
        </div>
        {products.items.length === 0 ? (
          <p className="mt-8 text-zinc-500">No products yet. Add some from the admin panel.</p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.items.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
