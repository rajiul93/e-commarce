'use client';

import { Children, useEffect, useMemo, useState, type ReactNode } from 'react';

const SLIDE_STEP = 2;

function usePerView() {
  const [perView, setPerView] = useState(2);

  useEffect(() => {
    const mqDesktop = window.matchMedia('(min-width: 1024px)');
    const mqTablet = window.matchMedia('(min-width: 640px)');

    const update = () => {
      if (mqDesktop.matches) setPerView(6);
      else if (mqTablet.matches) setPerView(4);
      else setPerView(2);
    };

    update();
    mqDesktop.addEventListener('change', update);
    mqTablet.addEventListener('change', update);
    return () => {
      mqDesktop.removeEventListener('change', update);
      mqTablet.removeEventListener('change', update);
    };
  }, []);

  return perView;
}

type Props = {
  children: ReactNode;
  className?: string;
};

export function ProductCarousel({ children, className = '' }: Props) {
  const perView = usePerView();
  const items = Children.toArray(children);
  const [index, setIndex] = useState(0);

  const maxIndex = Math.max(0, items.length - perView);
  const activeIndex = Math.min(index, maxIndex);
  const canPrev = activeIndex > 0;
  const canNext = activeIndex < maxIndex;
  const itemWidth = 100 / perView;

  const dotCount = useMemo(
    () => Math.ceil((maxIndex + 1) / SLIDE_STEP),
    [maxIndex],
  );
  const activeDot = Math.floor(activeIndex / SLIDE_STEP);

  if (items.length === 0) return null;

  if (items.length <= perView) {
    return (
      <div className={className}>
        <div
          className="grid gap-3 sm:gap-4"
          style={{ gridTemplateColumns: `repeat(${perView}, minmax(0, 1fr))` }}
        >
          {items.map((child, i) => (
            <div key={i} className="min-w-0">
              {child}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out will-change-transform"
          style={{ transform: `translateX(-${activeIndex * itemWidth}%)` }}
        >
          {items.map((child, i) => (
            <div
              key={i}
              className="shrink-0 px-1.5 sm:px-2"
              style={{ width: `${itemWidth}%` }}
            >
              <div className="min-w-0">{child}</div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        aria-label="Previous products"
        disabled={!canPrev}
        onClick={() => setIndex((i) => Math.max(0, Math.min(i, maxIndex) - SLIDE_STEP))}
        className="absolute -left-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white text-lg text-zinc-700 shadow-md transition hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-0 sm:-left-4 sm:h-10 sm:w-10"
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="Next products"
        disabled={!canNext}
        onClick={() =>
          setIndex((i) => Math.min(maxIndex, Math.min(i, maxIndex) + SLIDE_STEP))
        }
        className="absolute -right-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white text-lg text-zinc-700 shadow-md transition hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-0 sm:-right-4 sm:h-10 sm:w-10"
      >
        ›
      </button>

      {dotCount > 1 ? (
        <div className="mt-4 flex justify-center gap-1.5">
          {Array.from({ length: dotCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(Math.min(i * SLIDE_STEP, maxIndex))}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeDot ? 'w-5 bg-primary' : 'w-1.5 bg-zinc-300'
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
