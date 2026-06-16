'use client';

import type { HomeHeroSettings } from '@/types';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Props = {
  hero: HomeHeroSettings;
};

const SLIDE_INTERVAL_MS = 5000;
const SLIDE_DURATION_S = SLIDE_INTERVAL_MS / 1000;
const CROSSFADE_DURATION_S = 0.9;

function kenBurnsMotion(slideIndex: number, reduceMotion: boolean) {
  if (reduceMotion) {
    return {
      initial: { scale: 1, x: '0%', y: '0%' },
      animate: { scale: 1, x: '0%', y: '0%' },
    };
  }

  const animate =
    slideIndex % 2 === 0
      ? { scale: 1.1, x: '-2%', y: '-1.5%' }
      : { scale: 1.1, x: '2%', y: '1.5%' };

  return {
    initial: { scale: 1, x: '0%', y: '0%' },
    animate,
  };
}

function SlideImage({
  src,
  alt,
  href,
  className,
}: {
  src: string;
  alt: string;
  href?: string | null;
  className?: string;
}) {
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`h-full w-full object-cover ${className ?? ''}`}
    />
  );

  if (href) {
    return (
      <Link href={href} className="block h-full w-full">
        {img}
      </Link>
    );
  }
  return img;
}

function KenBurnsSlide({
  src,
  alt,
  href,
  slideIndex,
}: {
  src: string;
  alt: string;
  href?: string | null;
  slideIndex: number;
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const { initial, animate } = kenBurnsMotion(slideIndex, reduceMotion);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        opacity: { duration: CROSSFADE_DURATION_S, ease: 'easeInOut' },
      }}
    >
      <motion.div
        className="h-full w-full origin-center"
        initial={initial}
        animate={animate}
        transition={{
          scale: { duration: SLIDE_DURATION_S, ease: [0.42, 0, 0.58, 1] },
          x: { duration: SLIDE_DURATION_S, ease: [0.42, 0, 0.58, 1] },
          y: { duration: SLIDE_DURATION_S, ease: [0.42, 0, 0.58, 1] },
        }}
      >
        <SlideImage src={src} alt={alt} href={href} className="rounded-none" />
      </motion.div>
    </motion.div>
  );
}

function HeroSlider({ slides }: { slides: HomeHeroSettings['slides'] }) {
  const [index, setIndex] = useState(0);
  const validSlides = slides.filter((s) => s.image?.url);

  useEffect(() => {
    if (validSlides.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % validSlides.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [validSlides.length]);

  if (!validSlides.length) {
    return (
      <div className="flex h-full min-h-[280px] items-center justify-center bg-zinc-100 text-sm text-zinc-500">
        No slider images configured
      </div>
    );
  }

  const current = validSlides[index];
  const href = current.product?.slug ? `/products/${current.product.slug}` : null;

  return (
    <div className="relative h-full min-h-[280px] overflow-hidden bg-zinc-100">
      <AnimatePresence initial={false} mode="sync">
        <KenBurnsSlide
          key={`${index}-${current.image!.url}`}
          slideIndex={index}
          src={current.image!.url}
          alt={current.product?.title ?? 'Hero slide'}
          href={href}
        />
      </AnimatePresence>

      {validSlides.length > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => setIndex((i) => (i - 1 + validSlides.length) % validSlides.length)}
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 px-3 py-2 text-white hover:bg-black/60"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => setIndex((i) => (i + 1) % validSlides.length)}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 px-3 py-2 text-white hover:bg-black/60"
          >
            ›
          </button>
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {validSlides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-2 w-2 rounded-full ${i === index ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function SidePanel({ items }: { items: HomeHeroSettings['sideItems'] }) {
  const valid = items.filter((item) => item.image?.url && item.product?.slug);
  if (!valid.length) {
    return (
      <div className="flex h-full min-h-[280px] items-center justify-center bg-zinc-100 text-sm text-zinc-500">
        No side products configured
      </div>
    );
  }

  if (valid.length === 1) {
    const item = valid[0];
    return (
      <Link
        href={`/products/${item.product!.slug}`}
        className="block h-full min-h-[280px] overflow-hidden"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image!.url}
          alt={item.product!.title}
          className="h-full w-full rounded-none object-cover transition hover:scale-[1.02]"
        />
      </Link>
    );
  }

  return (
    <div className="grid h-full min-h-[280px] grid-rows-2 gap-3">
      {valid.slice(0, 2).map((item) => (
        <Link
          key={item.product!._id}
          href={`/products/${item.product!.slug}`}
          className="block overflow-hidden"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image!.url}
            alt={item.product!.title}
            className="h-full w-full rounded-none object-cover transition hover:scale-[1.02]"
          />
        </Link>
      ))}
    </div>
  );
}

export function HomeHero({ hero }: Props) {
  if (!hero.isActive) {
    return (
      <section className="rounded-2xl bg-zinc-900 px-8 py-16 text-white">
        <p className="text-sm uppercase tracking-widest text-zinc-400">Welcome</p>
        <h1 className="mt-2 max-w-2xl text-4xl font-bold tracking-tight">
          Discover quality products at great prices
        </h1>
        <Link
          href="/products"
          className="mt-6 inline-block rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
        >
          Shop now
        </Link>
      </section>
    );
  }

  const hasSlides = hero.slides.some((s) => s.image?.url);

  if (!hasSlides) {
    return (
      <section className="rounded-2xl bg-zinc-900 px-8 py-16 text-white">
        <p className="text-sm uppercase tracking-widest text-zinc-400">Welcome</p>
        <h1 className="mt-2 max-w-2xl text-4xl font-bold tracking-tight">
          Discover quality products at great prices
        </h1>
        <Link
          href="/products"
          className="mt-6 inline-block rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
        >
          Shop now
        </Link>
      </section>
    );
  }

  if (hero.style === 'slider_only') {
    return (
      <section>
        <HeroSlider slides={hero.slides} />
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4 lg:flex-row lg:gap-6">
      <div className="min-w-0 lg:w-[65%]">
        <HeroSlider slides={hero.slides} />
      </div>
      <div className="min-w-0 lg:w-[35%]">
        <SidePanel items={hero.sideItems} />
      </div>
    </section>
  );
}
