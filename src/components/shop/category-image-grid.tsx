'use client';

import { HorizontalScrollRow } from '@/components/shop/horizontal-scroll-row';
import Link from 'next/link';
import type { Category } from '@/types';

export function CategoryImageGrid({ categories }: { categories: Category[] }) {
  const withImage = categories.filter((c) => c.image?.url);
  if (!withImage.length) return null;

  return (
    <section className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Browse</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900">Shop by category</h2>
      </div>
      <HorizontalScrollRow innerClassName="gap-3">
        {withImage.map((cat) => (
          <Link
            key={cat._id}
            href={`/products?category=${cat._id}`}
            className="group w-24 shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-950/5 transition hover:-translate-y-0.5 hover:shadow-md sm:w-28"
            title={cat.categoryName}
          >
            <div className="aspect-square overflow-hidden bg-zinc-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cat.image!.url}
                alt={cat.categoryName}
                className="h-full w-full object-cover transition group-hover:scale-105"
              />
            </div>
          </Link>
        ))}
      </HorizontalScrollRow>
    </section>
  );
}
