'use client';

import { CartQuantityControls } from '@/components/shop/cart-quantity-controls';
import { formatPrice } from '@/components/shop/product-card';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { getCartLineMaxStock } from '@/lib/cart-utils';
import { getProductThumbnailUrl } from '@/lib/product-image-utils';
import { formatVariantLabel } from '@/lib/variant-utils';
import type { CartLine, Product, Variant } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function lineProduct(line: CartLine): Product | null {
  return typeof line.productId === 'object' ? line.productId : null;
}

function lineTitle(line: CartLine) {
  return lineProduct(line)?.title ?? 'Product';
}

function lineSlug(line: CartLine) {
  return lineProduct(line)?.slug;
}

function lineVariantLabel(line: CartLine) {
  const variant = line.variantId as Variant | undefined;
  return variant && typeof variant === 'object' ? formatVariantLabel(variant) : null;
}

function linePrice(line: CartLine) {
  const variant = line.variantId as Variant | undefined;
  return typeof variant === 'object' ? variant.price : 0;
}

function lineTotal(line: CartLine) {
  return linePrice(line) * line.quantity;
}

function RemoveIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0v12a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7" />
      <path strokeLinecap="round" d="M10 11v6M14 11v6" />
    </svg>
  );
}

export default function AccountCartPage() {
  const router = useRouter();
  const {
    cart,
    isLoading,
    isLoggedIn,
    updatingLineId,
    updateLineQuantity,
    removeLine,
    toggleLineSelected,
  } = useCart();

  if (!isLoggedIn) {
    return (
      <p className="text-sm text-zinc-600">
        Please{' '}
        <Link href="/login" className="font-medium text-primary underline">
          login
        </Link>{' '}
        to view your cart.
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-zinc-100" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-zinc-100" />
        ))}
      </div>
    );
  }

  const items = cart?.items ?? [];
  const selectedCount = items.filter((i) => i.isSelected).length;
  const subtotal = items
    .filter((i) => i.isSelected)
    .reduce((sum, line) => sum + lineTotal(line), 0);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">My cart</h1>
          {items.length > 0 ? (
            <p className="mt-0.5 text-xs text-zinc-500 sm:text-sm">
              {items.length} item{items.length === 1 ? '' : 's'}
              {selectedCount < items.length ? ` · ${selectedCount} selected` : ''}
            </p>
          ) : null}
        </div>
        {items.length > 0 ? (
          <Link href="/products" className="text-xs font-medium text-primary sm:text-sm">
            + Add more
          </Link>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-14 text-center">
          <p className="text-sm font-medium text-zinc-700">Your cart is empty</p>
          <p className="mt-1 text-xs text-zinc-500">Browse products and add items you like.</p>
          <Link
            href="/products"
            className="mt-5 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/70"
          >
            Shop now
          </Link>
        </div>
      ) : (
        <>
          <ul className="space-y-3 md:space-y-4">
            {items.map((line) => {
              const product = lineProduct(line);
              const slug = lineSlug(line);
              const variantLabel = lineVariantLabel(line);
              const maxStock = getCartLineMaxStock(line);
              const lineLoading = updatingLineId === line._id;
              const thumb = product ? getProductThumbnailUrl(product) : '/placeholder-product.svg';

              return (
                <li
                  key={line._id}
                  className={`overflow-hidden border bg-white shadow-sm transition ${
                    line.isSelected ? 'border-zinc-200' : 'border-zinc-100 opacity-75'
                  }`}
                >
                  <div className="flex gap-3 p-3 sm:p-4">
                    <label className="flex shrink-0 items-start pt-1">
                      <input
                        type="checkbox"
                        checked={line.isSelected}
                        disabled={lineLoading}
                        onChange={(e) => toggleLineSelected(line._id, e.target.checked)}
                        className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary"
                      />
                    </label>

                    {slug ? (
                      <Link
                        href={`/products/${slug}`}
                        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-none bg-zinc-100 sm:h-24 sm:w-24"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={thumb} alt="" className="h-full w-full rounded-none object-cover" />
                      </Link>
                    ) : (
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-none bg-zinc-100 sm:h-24 sm:w-24">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={thumb} alt="" className="h-full w-full rounded-none object-cover" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        {slug ? (
                          <Link
                            href={`/products/${slug}`}
                            className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 sm:text-base"
                          >
                            {lineTitle(line)}
                          </Link>
                        ) : (
                          <p className="line-clamp-2 text-sm font-semibold text-zinc-900 sm:text-base">
                            {lineTitle(line)}
                          </p>
                        )}
                        <button
                          type="button"
                          aria-label="Remove item"
                          disabled={lineLoading}
                          onClick={() => removeLine(line._id)}
                          className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        >
                          <RemoveIcon />
                        </button>
                      </div>

                      {variantLabel ? (
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-zinc-500 sm:text-xs">
                          {variantLabel}
                        </p>
                      ) : null}

                      <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
                        {formatPrice(linePrice(line))} each
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/80 px-3 py-2.5 sm:px-4">
                    <CartQuantityControls
                      quantity={line.quantity}
                      max={maxStock}
                      loading={lineLoading}
                      size="sm"
                      onIncrement={() => updateLineQuantity(line._id, line.quantity + 1)}
                      onDecrement={() => updateLineQuantity(line._id, line.quantity - 1)}
                    />
                    <p className="text-sm font-bold text-primary sm:text-base">
                      {formatPrice(lineTotal(line))}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="h-24 md:hidden" aria-hidden />

          <div className="fixed inset-x-0 bottom-16 z-40 border-t border-zinc-200/90 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md md:static md:rounded-2xl md:border md:bg-zinc-50 md:px-5 md:py-4 md:shadow-none">
            <div className="mx-auto flex max-w-lg items-center justify-between gap-4 md:max-w-none">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                  Selected subtotal
                </p>
                <p className="text-lg font-bold text-zinc-900 sm:text-xl">{formatPrice(subtotal)}</p>
              </div>
              <Button
                className="shrink-0 !rounded-xl !bg-primary !px-5 !py-2.5 !text-sm font-semibold hover:!bg-primary/70 disabled:!opacity-50"
                onClick={() => router.push('/checkout')}
                disabled={selectedCount === 0}
              >
                Checkout
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
