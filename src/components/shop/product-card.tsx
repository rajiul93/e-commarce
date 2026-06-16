import type { Product } from '@/types';
import { getProductThumbnailUrl } from '@/lib/product-image-utils';
import {
  applyOfferToPrice,
  getOfferLabel,
  getProductCardBadges,
  hasActiveOffer,
} from '@/lib/product-offer';
import Link from 'next/link';
import { ProductCardWishlist } from '@/components/shop/product-card-wishlist';
import { ProductCardAddToCart } from '@/components/shop/product-card-add-to-cart';

function formatPrice(amount?: number | null) {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(amount);
}

const BADGE_STYLE: Record<string, string> = {
  featured: 'bg-violet-600/90 text-white shadow-violet-900/20',
  'best-seller': 'bg-amber-500/90 text-white shadow-amber-900/20',
  offer: 'bg-rose-600/90 text-white shadow-rose-900/20',
};

function StarRating({ value }: { value: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;

  return (
    <div className="flex items-center gap-1">
      <div className="flex text-amber-400">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            viewBox="0 0 20 20"
            className={`h-3.5 w-3.5 ${i < full || (i === full && half) ? 'fill-current' : 'fill-zinc-200 text-zinc-200'}`}
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-xs font-medium text-zinc-600">{value.toFixed(1)}</span>
    </div>
  );
}

function formatPriceRange(min?: number | null, max?: number | null) {
  if (min != null && max != null && min !== max) {
    return `${formatPrice(min)} – ${formatPrice(max)}`;
  }
  return formatPrice(min ?? max);
}

export function ProductCard({ product }: { product: Product }) {
  const badges = getProductCardBadges(product);
  const onOffer = hasActiveOffer(product);
  const offerLabel = getOfferLabel(product);
  const minSale =
    product.minPrice != null ? applyOfferToPrice(product.minPrice, product) : null;
  const maxSale =
    product.maxPrice != null ? applyOfferToPrice(product.maxPrice, product) : null;

  const totalStock = product.totalStock ?? 0;
  const inStock = totalStock > 0;
  const lowStock = inStock && totalStock <= 5;
  const rating = product.averageRating ?? 0;

  return (
    <article className="group/card relative flex h-full flex-col overflow-hidden  bg-white shadow-sm ring-1 ring-zinc-950/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-900/10">
      <ProductCardWishlist
        productId={product._id}
        className="absolute right-3 top-3 z-20"
      />

      <Link
        href={`/products/${product.slug}`}
        className="relative block overflow-hidden bg-gradient-to-br from-zinc-100 to-zinc-200"
      >
        <div className="relative aspect-[4/5] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getProductThumbnailUrl(product)}
            alt={product.title}
            className={`h-full w-full object-cover transition duration-500 group-hover/card:scale-105 ${
              !inStock ? 'opacity-60 saturate-50' : ''
            }`}
          />

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-900/20 via-transparent to-transparent opacity-0 transition duration-300 group-hover/card:opacity-100" />

          {badges.length > 0 ? (
            <div className="absolute left-2.5 top-2.5 z-10 flex max-w-[calc(100%-3.5rem)] flex-col gap-1.5">
              {badges.map((badge) => (
                <span
                  key={badge.key}
                  className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-sm ${BADGE_STYLE[badge.key] ?? badge.className}`}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          ) : null}

          {!inStock ? (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/10 backdrop-blur-[1px]">
              <span className="rounded-full bg-zinc-900/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                Sold out
              </span>
            </div>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link href={`/products/${product.slug}`} className="min-w-0 space-y-1">
          {product.brand?.brandName ? (
            <p className="truncate text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
              {product.brand.brandName}
            </p>
          ) : product.category ? (
            <p className="truncate text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
              {product.category.categoryName}
            </p>
          ) : null}
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 transition group-hover/card:text-primary">
            {product.title}
          </h3>
        </Link>


      

        <div className="mt-auto space-y-2 pt-1">
          {onOffer && product.minPrice != null ? (
            <div className="flex flex-wrap items-end gap-2">
              <p className="text-lg font-bold tracking-tight text-primary">
                {formatPriceRange(minSale, maxSale)}
              </p>
              <p className="pb-0.5 text-xs text-zinc-400 line-through">
                {formatPriceRange(product.minPrice, product.maxPrice)}
              </p>
              {offerLabel ? (
                <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                  {offerLabel}
                </span>
              ) : null}
            </div>
          ) : (
            <p className="text-lg font-bold tracking-tight text-primary">
              {formatPriceRange(product.minPrice, product.maxPrice)}
            </p>
          )}

 <div className="flex justify-between items-center">
 {lowStock ? (
            <p className="text-[11px] font-medium text-amber-600">
              Only {totalStock} left
            </p>
          ) : inStock ? (
            <p className="text-[11px] font-medium text-emerald-600">In stock</p>
          ) : null}
        {rating > 0 ? <StarRating value={rating} /> : null}

 </div>

          <ProductCardAddToCart
            productId={product._id}
            slug={product.slug}
            inStock={inStock}
          />
        </div>
      </div>
    </article>
  );
}

export { formatPrice };
