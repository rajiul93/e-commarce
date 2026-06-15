'use client';

import { useState } from 'react';

type Tab = 'description' | 'reviews';

type Props = {
  descriptionHtml: string;
  hasDescription: boolean;
  averageRating?: number;
};

function StarRating({ value }: { value: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;

  return (
    <div className="flex items-center gap-2">
      <div className="flex text-amber-400">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            viewBox="0 0 20 20"
            className={`h-5 w-5 ${i < full || (i === full && half) ? 'fill-current' : 'fill-zinc-200 text-zinc-200'}`}
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-sm font-medium text-zinc-700">{value.toFixed(1)}</span>
    </div>
  );
}

export function ProductDetailTabs({
  descriptionHtml,
  hasDescription,
  averageRating = 0,
}: Props) {
  const [active, setActive] = useState<Tab>('description');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'description', label: 'Description' },
    { id: 'reviews', label: 'Reviews' },
  ];

  return (
    <section className="border-t border-zinc-200 pt-8">
      <div
        className="flex gap-1 border-b border-zinc-200"
        role="tablist"
        aria-label="Product details"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => setActive(tab.id)}
            className={`-mb-px border-b-2 px-4 py-3 text-sm font-medium transition ${
              active === tab.id
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="pt-6" role="tabpanel">
        {active === 'description' ? (
          hasDescription ? (
            <div
              className="product-description text-sm"
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />
          ) : (
            <p className="text-sm text-zinc-500">No description available for this product.</p>
          )
        ) : (
          <div className="space-y-4">
            {averageRating > 0 ? (
              <div className="flex flex-wrap items-center gap-3">
                <StarRating value={averageRating} />
                <span className="text-sm text-zinc-500">Average rating</span>
              </div>
            ) : null}
            <p className="text-sm text-zinc-500">No customer reviews yet.</p>
          </div>
        )}
      </div>
    </section>
  );
}
